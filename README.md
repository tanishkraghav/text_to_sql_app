# Text-to-SQL LLM Application

This project is an end-to-end **Text-to-SQL LLM application** built using the **Groq API**. The application allows users to convert natural language text into SQL queries and retrieve results from a connected SQL database.  

This repository contains all the code necessary to run the application locally and interact with your database using a simple, AI-powered interface.

---

## Features

- Convert natural language queries into SQL using a Large Language Model (LLM) via Groq API.
- Connect to a SQL database and retrieve query results.
- End-to-end workflow from user input → SQL generation → database retrieval.
- Easy-to-run, lightweight Python-based application.

---

## Demo



---

## Requirements

- Python 3.9 or higher
- A valid **Groq API Key**
- Access to a SQL database (SQLite, MySQL, PostgreSQL, etc.)
- Required Python packages (listed in `requirements.txt`)

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tanishkraghav/text_to_sql_app.git
   cd text_to_sql_app

2. **Create a virtual environment (optional but recommended)**
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate


3. **Install dependencies**4
pip install -r requirements.txt


4. **Set your environment variables**
   
*Create a .env file in the root directory:*
GROQ_API_KEY="your_groq_api_key_here"

5. **Acknowledgements**

Built using Groq API
Inspired by the idea of natural language interfaces for databases.
   
