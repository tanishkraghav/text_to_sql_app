import os
import sqlite3
import pandas as pd  # type: ignore
import streamlit as st  # type: ignore
from groq import Groq  # type: ignore
from dotenv import load_dotenv  # type: ignore
import seaborn as sns  # type: ignore
import matplotlib.pyplot as plt  # type: ignore


st.set_page_config(page_title="Text to SQL with Groq", layout="wide")
st.title("📝 Text-to-SQL App (Groq Powered)")


if "history" not in st.session_state:
    st.session_state["history"] = []


load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


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
    - IMPORTANT: If a column name contains spaces, wrap it in backticks like `column name`.
    - Return ONLY the SQL query, no explanations.
    - Do NOT include ```sql or ``` in your response.
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You convert text into SQL queries."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=512
        )
        return response.choices[0].message.content.strip()
    except Exception as e:  # ✅ Catch API timeout or any error
        return f"⚠️ Groq API error: {str(e)}"


def explain_sql(query):
    prompt = f"Explain in simple English what this SQL query does:\n{query}"
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an SQL teacher."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=256
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"⚠️ Could not explain query: {str(e)}"


# Execute SQL

def run_sql(query):
    conn = sqlite3.connect(DB_PATH)
    try:
        df = pd.read_sql_query(query, conn)
        conn.close()
        return df
    except Exception as e:
        conn.close()
        return str(e)


# Streamlit Workflow

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

        # ✅ Explain SQL
        explanation = explain_sql(sql_query)
        st.info(f"💡 Query Meaning: {explanation}")

        # ✅ Run SQL query
        result = run_sql(sql_query)

        if isinstance(result, pd.DataFrame):
            st.success("✅ Query executed successfully!")
            st.dataframe(result)

            # ✅ Save to history
            st.session_state["history"].append((sql_query, result))

            # --- Visualization Section ---
            if len(result.columns) >= 2:  # Need at least 2 columns
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


# General AI Assistant

st.subheader("🤖 Ask Anything (AI Assistant)")
general_question = st.text_area("Ask your question here:")

if st.button("Ask Assistant"):
    if general_question.strip():
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": general_question}
                ],
                temperature=0.7,
                max_tokens=512
            )
            st.write("### 💬 Answer:")
            st.success(response.choices[0].message.content.strip())
        except Exception as e:
            st.error(f"⚠️ Error: {str(e)}")

# -----------------------
# Query History Section
# -----------------------
st.write("## 📜 Query History")
for i, (query, res) in enumerate(st.session_state["history"]):
    with st.expander(f"Query {i+1}: {query}"):
        st.write(res)
