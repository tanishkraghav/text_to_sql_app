from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker, relationship
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
import os
from dotenv import load_dotenv
import sqlite3
from groq import Groq
from google.auth.transport import requests
from google.oauth2 import id_token

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Database setup
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize Groq client
try:
    groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY and GROQ_API_KEY != "test-key-replace-with-actual-groq-api-key" else None
except Exception as e:
    print(f"Warning: Could not initialize Groq client: {e}")
    groq_client = None

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    queries = relationship("QueryHistory", back_populates="user")
    databases = relationship("UserDatabase", back_populates="user")

class QueryHistory(Base):
    __tablename__ = "query_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question = Column(Text, nullable=False)
    sql_query = Column(Text)
    execution_time = Column(Float)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="queries")

class UserDatabase(Base):
    __tablename__ = "user_databases"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    db_path = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="databases")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleLogin(BaseModel):
    id_token: str

class TokenData(BaseModel):
    username: Optional[str] = None

class QueryRequest(BaseModel):
    question: str
    database_id: Optional[int] = None

class QueryResponse(BaseModel):
    sql_query: str
    results: List[dict]
    execution_time: float
    error: Optional[str] = None

class QueryHistoryResponse(BaseModel):
    id: int
    question: str
    sql_query: Optional[str]
    execution_time: Optional[float]
    error_message: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class DatabaseCreate(BaseModel):
    name: str
    db_path: str

class DatabaseResponse(BaseModel):
    id: int
    name: str
    db_path: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# FastAPI app
app = FastAPI(title="Text-to-SQL API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# Text-to-SQL function
def generate_sql_query(question: str, schema_info: str) -> str:
    """Generate SQL query using Groq API"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API not configured. Please set GROQ_API_KEY in .env file.")
    
    prompt = f"""You are a SQL expert. Convert the following natural language question into a SQL query.
    
Database Schema:
{schema_info}

Question: {question}

Generate only the SQL query without any explanation. The query should be valid SQLite syntax."""

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a SQL expert. Generate only SQL queries without explanation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama3-8b-8192",
            temperature=0.1,
        )
        
        sql_query = chat_completion.choices[0].message.content.strip()
        # Clean up the query - remove markdown code blocks if present
        sql_query = sql_query.replace("```sql", "").replace("```", "").strip()
        return sql_query
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating SQL: {str(e)}")

def get_database_schema(db_path: str) -> str:
    """Get database schema information"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        schema_info = ""
        for table in tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            schema_info += f"\nTable: {table_name}\n"
            schema_info += "Columns:\n"
            for col in columns:
                schema_info += f"  - {col[1]} ({col[2]})\n"
        
        conn.close()
        return schema_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading schema: {str(e)}")

def execute_sql_query(db_path: str, sql_query: str) -> List[dict]:
    """Execute SQL query and return results"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute(sql_query)
        columns = [description[0] for description in cursor.description]
        results = []
        
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
        
        conn.close()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing query: {str(e)}")

# Routes
@app.get("/")
async def root():
    return {"message": "Text-to-SQL API", "version": "1.0.0"}

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/google", response_model=Token)
async def google_login(google_data: GoogleLogin, db: Session = Depends(get_db)):
    """Handle Google OAuth login"""
    try:
        # Verify the ID token (optional - if you have a client ID configured)
        # For now, we'll accept it directly
        # In production, you'd verify with: id_token.verify_oauth2_token()
        
        # Extract email from the token (you'd need to decode it properly)
        # For now, create a demo user or look up by email
        # In production, decode the JWT token properly
        
        # Create a test user with Google
        test_email = f"google_{google_data.id_token[:20]}@example.com"
        test_username = f"google_user_{hash(google_data.id_token) % 10000}"
        
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            hashed_password = get_password_hash("google_oauth_user")
            user = User(
                email=test_email,
                username=test_username,
                hashed_password=hashed_password,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google login failed: {str(e)}"
        )

@app.get("/api/user/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/api/query/execute", response_model=QueryResponse)
async def execute_query(
    query: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    import time
    start_time = time.time()
    
    try:
        # Get database path
        if query.database_id:
            user_db = db.query(UserDatabase).filter(
                UserDatabase.id == query.database_id,
                UserDatabase.user_id == current_user.id,
                UserDatabase.is_active == True
            ).first()
            
            if not user_db:
                raise HTTPException(status_code=404, detail="Database not found")
            
            db_path = user_db.db_path
        else:
            # Use default database
            db_path = "user_db.db"
        
        # Get schema
        schema_info = get_database_schema(db_path)
        
        # Generate SQL
        sql_query = generate_sql_query(query.question, schema_info)
        
        # Execute SQL
        results = execute_sql_query(db_path, sql_query)
        
        execution_time = time.time() - start_time
        
        # Save to history
        query_history = QueryHistory(
            user_id=current_user.id,
            question=query.question,
            sql_query=sql_query,
            execution_time=execution_time
        )
        db.add(query_history)
        db.commit()
        
        return QueryResponse(
            sql_query=sql_query,
            results=results,
            execution_time=execution_time
        )
    
    except Exception as e:
        execution_time = time.time() - start_time
        error_msg = str(e)
        
        # Save error to history
        query_history = QueryHistory(
            user_id=current_user.id,
            question=query.question,
            execution_time=execution_time,
            error_message=error_msg
        )
        db.add(query_history)
        db.commit()
        
        raise HTTPException(status_code=500, detail=error_msg)

@app.get("/api/query/history", response_model=List[QueryHistoryResponse])
async def get_query_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    queries = db.query(QueryHistory).filter(
        QueryHistory.user_id == current_user.id
    ).order_by(QueryHistory.created_at.desc()).limit(limit).all()
    
    return queries

@app.post("/api/database/add", response_model=DatabaseResponse)
async def add_database(
    database: DatabaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify database exists and is accessible
    try:
        conn = sqlite3.connect(database.db_path)
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot connect to database: {str(e)}")
    
    db_entry = UserDatabase(
        user_id=current_user.id,
        name=database.name,
        db_path=database.db_path
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return db_entry

@app.get("/api/database/list", response_model=List[DatabaseResponse])
async def list_databases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    databases = db.query(UserDatabase).filter(
        UserDatabase.user_id == current_user.id,
        UserDatabase.is_active == True
    ).all()
    
    return databases

@app.get("/api/database/{database_id}/schema")
async def get_schema(
    database_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_db = db.query(UserDatabase).filter(
        UserDatabase.id == database_id,
        UserDatabase.user_id == current_user.id
    ).first()
    
    if not user_db:
        raise HTTPException(status_code=404, detail="Database not found")
    
    schema_info = get_database_schema(user_db.db_path)
    return {"schema": schema_info}

@app.on_event("startup")
async def startup_event():
    """Create demo account on startup if it doesn't exist"""
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            hashed_password = get_password_hash("demo123")
            demo_user = User(
                email="demo@example.com",
                username="demo",
                hashed_password=hashed_password,
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            print("Demo account created successfully")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
