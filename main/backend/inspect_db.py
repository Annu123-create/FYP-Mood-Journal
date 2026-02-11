import sqlite3
import os

# The path to your database file
db_file = 'mood_journal.db'

def inspect_table(cursor, table_name):
    """A helper function to print all data from a given table."""
    print(f"\n--- Data from table: '{table_name}' ---")
    try:
        # Get column names first
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = [description[1] for description in cursor.fetchall()]
        print("Columns:", " | ".join(columns))
        print("-" * 40)

        # Get all rows from the table
        cursor.execute(f"SELECT * FROM {table_name};")
        rows = cursor.fetchall()

        if rows:
            for row in rows:
                print(row)
        else:
            print("Table is empty.")
        print("-" * 40)

    except sqlite3.Error as e:
        print(f"Error reading table {table_name}: {e}")


if os.path.exists(db_file):
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()

        print(f"Inspecting database: {db_file}")
        
        # Inspect the 'users' table
        inspect_table(cursor, 'users')
        
        # Inspect the 'entries' table
        inspect_table(cursor, 'entries')

    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()
            print("\nInspection complete. Connection closed.")
else:
    print(f"Error: Database file '{db_file}' not found.")
