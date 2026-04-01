import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

try:
    print("Connecting to PostgreSQL...")
    conn = psycopg2.connect(user='postgres', password='Nahuel71', host='localhost', port='5432')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    print("Creating database salesianosdb...")
    cur.execute('CREATE DATABASE salesianosdb;')
    cur.close()
    conn.close()
    print("Database created successfully!")
except psycopg2.errors.DuplicateDatabase:
    print("Database salesianosdb already exists, skipping.")
except Exception as e:
    print(f"Error creating DB: {e}")
