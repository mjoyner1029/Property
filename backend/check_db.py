import sqlite3

conn = sqlite3.connect('instance/dev.db')
cursor = conn.cursor()

# Get a list of all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print('Tables in database:')
for table in tables:
    print(f"- {table[0]}")
    
# Check foreign keys and indexes in sqlite_master
print('\nForeign keys and indexes:')
cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='index' OR sql LIKE '%FOREIGN KEY%';")
constraints = cursor.fetchall()
for name, sql in constraints:
    print(f"- {name}: {sql}")

conn.close()

