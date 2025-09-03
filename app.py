import os
import sqlite3
import pandas as pd  # type: ignore
import streamlit as st  # type: ignore
from groq import Groq  # type: ignore
from dotenv import load_dotenv  # type: ignore
import seaborn as sns # type: ignore
import matplotlib.pyplot as plt # type: ignore

# Initialize query history in session state
if "history" not in st.session_state:
    st.session_state["history"] = []


# -----------------------
# Initialize Groq Client
# -----------------------
load_dotenv()  # Load environment variables
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# -----------------------
# Streamlit UI
# -----------------------
st.set_page_config(page_title="Text to SQL with Groq", layout="wide")
st.title("📝 Text-to-SQL App (Groq Powered)")

# -----------------------
# Database Setup
# -----------------------
DB_PATH = "user_db.db"

def init_sample_db():
    """Create a fallback sample DB if user doesn't upload"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY,
            name TEXT,
            department TEXT,
            salary INTEGER
        )
    ''')
    cursor.execute("SELECT COUNT(*) FROM employees")
    if cursor.fetchone()[0] == 0:
        sample_data = [
            (1, "Alice", "HR", 50000),
            (2, "Bob", "Engineering", 80000),
            (3, "Charlie", "Sales", 60000),
            (4, "David", "Engineering", 90000)
        ]
        cursor.executemany("INSERT INTO employees VALUES (?, ?, ?, ?)", sample_data)
    conn.commit()
    conn.close()

# -----------------------
# File Upload
# -----------------------
uploaded_file = st.file_uploader("📂 Upload a CSV or SQLite file", type=["csv", "db", "sqlite"])

if uploaded_file:
    if uploaded_file.name.endswith(".csv"):
        df = pd.read_csv(uploaded_file)
        conn = sqlite3.connect(DB_PATH)
        df.to_sql("uploaded_table", conn, if_exists="replace", index=False)
        conn.close()
        st.success(f"CSV uploaded and saved as table `uploaded_table` in {DB_PATH}")
        st.dataframe(df.head())
    else:
        with open(DB_PATH, "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.success(f"SQLite database uploaded successfully: {uploaded_file.name}")
else:
    init_sample_db()
    st.info("⚡ No file uploaded. Using sample employees database.")

# -----------------------
# Fetch Database Schema
# -----------------------
def get_db_schema():
    """Extract schema (tables + columns) from SQLite DB"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    schema = ""
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    for (table,) in tables:
        schema += f"Table: {table}\n"
        cursor.execute(f"PRAGMA table_info({table});")
        columns = cursor.fetchall()
        for col in columns:
            schema += f" - {col[1]} ({col[2]})\n"
        schema += "\n"

    conn.close()
    return schema.strip()

# -----------------------
# Groq SQL Generator
# -----------------------
def generate_sql(user_query, schema):
    prompt = f"""
    You are an expert SQL generator.
    Convert the following natural language query into a valid SQLite SQL query.
    Query: "{user_query}"

    Database schema:
    {schema}

    Rules:
    - Only use tables and columns from the schema.
    - If CSV uploaded, use table name: uploaded_table.
    - Return ONLY the SQL query, no explanations.
    - Do NOT include ```sql or ``` in your response.
    """

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "You convert text into SQL queries."},
            {"role": "user", "content": prompt}
        ],
        temperature=0,  # deterministic output
        max_tokens=512
    )
    return response.choices[0].message.content.strip()

# -----------------------
# Execute SQL
# -----------------------
def run_sql(query):
    conn = sqlite3.connect(DB_PATH)
    try:
        df = pd.read_sql_query(query, conn)
        conn.close()
        return df
    except Exception as e:
        conn.close()
        return str(e)

# -----------------------
# Streamlit Workflow
# -----------------------
user_input = st.text_input("Ask your question in plain English:")

if st.button("Generate SQL & Run"):
    if user_input.strip() == "":
        st.warning("Please enter a query.")
    else:
        # ✅ Fetch schema dynamically
        schema = get_db_schema()

        # ✅ Generate SQL
        sql_query = generate_sql(user_input, schema)
        st.code(sql_query, language="sql")

        # ✅ Run SQL query
        result = run_sql(sql_query)

        if isinstance(result, pd.DataFrame):

         st.success("✅ Query executed successfully!")
    st.dataframe(result)

    # ✅ Save to history
    st.session_state["history"].append((sql_query, result))

    # --- Visualization Section ---
    if len(result.columns) >= 2:  # Need at least 2 columns for plotting
        st.subheader("📊 Visualization")

        x_axis = st.selectbox("Select X-axis", result.columns, key=f"x_{sql_query}")
        y_axis = st.selectbox("Select Y-axis", result.columns, key=f"y_{sql_query}")

        if x_axis and y_axis:
            fig, ax = plt.subplots()
            sns.barplot(data=result, x=x_axis, y=y_axis, ax=ax)
            plt.xticks(rotation=45)
            st.pyplot(fig)


        else:
            st.error(f"❌ Error: {result}")

# --- Query History Section ---
st.write("## 📜 Query History")
for i, (query, res) in enumerate(st.session_state["history"]):
    with st.expander(f"Query {i+1}: {query}"):
        st.write(res)

