export interface Topic {
  id: string;
  title: string;
  phase: string;
  story: string;
  tableViz: string;
  stepByStep: { line: string; explanation: string; result: string }[];
  code: string;
  schema: string;
  syntaxCard: { title: string; content: string };
  mistakes: { wrong: string; correct: string; explanation: string }[];
  checkpoint: { question: string; options: string[]; answer: number; explanation: string };
  subtopics: string[];
}

export interface Phase {
  id: string;
  title: string;
  icon: string;
  topics: Topic[];
}

export const TUTORIAL_SCHEMA = `
CREATE TABLE departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT NOT NULL, location TEXT, budget INTEGER);
INSERT INTO departments VALUES (1, 'Engineering', 'Building A', 500000);
INSERT INTO departments VALUES (2, 'Marketing', 'Building B', 200000);
INSERT INTO departments VALUES (3, 'Sales', 'Building C', 300000);
INSERT INTO departments VALUES (4, 'HR', 'Building A', 150000);
INSERT INTO departments VALUES (5, 'Finance', 'Building D', 250000);
CREATE TABLE employees (emp_id INTEGER PRIMARY KEY, name TEXT NOT NULL, dept_id INTEGER, salary INTEGER, hire_date TEXT, manager_id INTEGER, city TEXT);
INSERT INTO employees VALUES (1, 'Alice', 1, 95000, '2020-01-15', NULL, 'New York');
INSERT INTO employees VALUES (2, 'Bob', 1, 85000, '2020-06-01', 1, 'San Francisco');
INSERT INTO employees VALUES (3, 'Charlie', 2, 70000, '2019-03-20', 1, 'New York');
INSERT INTO employees VALUES (4, 'Diana', 2, 72000, '2021-09-10', 3, 'Chicago');
INSERT INTO employees VALUES (5, 'Eve', 3, 65000, '2022-01-05', 1, 'Boston');
INSERT INTO employees VALUES (6, 'Frank', 3, 68000, '2020-11-30', 5, 'San Francisco');
INSERT INTO employees VALUES (7, 'Grace', 4, 60000, '2021-05-22', 1, 'New York');
INSERT INTO employees VALUES (8, 'Henry', 5, 90000, '2019-07-01', 1, 'Chicago');
INSERT INTO employees VALUES (9, 'Ivy', 1, 92000, '2022-03-15', 1, 'Boston');
INSERT INTO employees VALUES (10, 'Jack', 3, 55000, '2023-01-10', 5, NULL);
CREATE TABLE projects (project_id INTEGER PRIMARY KEY, project_name TEXT NOT NULL, dept_id INTEGER, start_date TEXT, end_date TEXT, status TEXT, budget INTEGER);
INSERT INTO projects VALUES (1, 'Alpha', 1, '2023-01-01', '2023-06-30', 'Completed', 100000);
INSERT INTO projects VALUES (2, 'Beta', 1, '2023-03-15', '2023-12-31', 'Active', 150000);
INSERT INTO projects VALUES (3, 'Gamma', 2, '2023-02-01', '2023-08-30', 'Completed', 80000);
INSERT INTO projects VALUES (4, 'Delta', 3, '2023-06-01', '2024-01-31', 'Active', 120000);
INSERT INTO projects VALUES (5, 'Epsilon', 5, '2023-04-01', '2023-09-30', 'Completed', 90000);
CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, product_id INTEGER, quantity INTEGER, order_date TEXT, amount REAL);
INSERT INTO orders VALUES (1, 1, 1, 2, '2023-01-20', 1999.98);
INSERT INTO orders VALUES (2, 1, 5, 5, '2023-02-15', 149.95);
INSERT INTO orders VALUES (3, 2, 2, 1, '2023-03-10', 699.99);
INSERT INTO orders VALUES (4, 2, 3, 2, '2023-04-05', 599.98);
INSERT INTO orders VALUES (5, 3, 1, 1, '2023-05-20', 999.99);
INSERT INTO orders VALUES (6, 3, 6, 10, '2023-06-15', 49.90);
INSERT INTO orders VALUES (7, 4, 8, 3, '2023-07-10', 449.97);
INSERT INTO orders VALUES (8, 5, 7, 2, '2023-08-05', 799.98);
INSERT INTO orders VALUES (9, 6, 4, 1, '2023-09-10', 199.99);
INSERT INTO orders VALUES (10, 7, 2, 2, '2023-10-15', 1399.98);
`;

// Helper to create topics quickly with full content
function T(id: string, title: string, phase: string, story: string, tableViz: string, steps: { line: string; explanation: string; result: string }[], code: string, syntaxTitle: string, syntaxContent: string, mistakes: { wrong: string; correct: string; explanation: string }[], checkpoint: { question: string; options: string[]; answer: number; explanation: string }, subtopics: string[], schema?: string): Topic {
  return { id, title, phase, story, tableViz, stepByStep: steps, code, schema: schema || TUTORIAL_SCHEMA, syntaxCard: { title: syntaxTitle, content: syntaxContent }, mistakes, checkpoint, subtopics };
}

export const phases: Phase[] = [
  // ==========================================
  // PHASE 1: SQL Foundations
  // ==========================================
  {
    id: '1', title: 'SQL Foundations', icon: '🏗️',
    topics: [
      T('1.1', 'What is SQL? / Database Fundamentals', '1',
        `Imagine you have a giant filing cabinet with thousands of folders, each containing information about customers, products, and orders. Without a system, finding anything would take forever. That's exactly what a database solves — it's like having a super-smart librarian who can instantly find, organize, and update any piece of information you need.\n\nSQL (Structured Query Language) is the language you use to talk to that librarian. Just like you'd ask a real librarian "Find me all books by J.K. Rowling published after 2000," you ask a database "Find me all customers who placed orders last month." SQL is the universal language of databases — it works with MySQL, PostgreSQL, SQLite, SQL Server, and Oracle.\n\nEvery company you can think of — Google, Amazon, Netflix, your bank — uses SQL behind the scenes. When you search for a product on Amazon, SQL is fetching those results. When you check your bank balance, SQL is pulling up your transactions. When Netflix recommends a show, SQL helped figure out what you might like. Learning SQL isn't just about passing interviews — it's about understanding how the digital world organizes and retrieves information.\n\nThere are five main types of SQL commands: SELECT (read data), INSERT (add data), UPDATE (change data), DELETE (remove data), and DDL commands like CREATE and ALTER (structure the database). As a beginner, you'll spend most of your time on SELECT because reading data is the foundation of everything else.`,
        `┌─────────────────────────────────────────┐
│         DATABASE = FILING CABINET        │
├─────────────────────────────────────────┤
│                                         │
│  TABLE = One drawer                     │
│  ┌──────────────────────────────────┐   │
│  │ employees                        │   │
│  ├──────┬────────┬────────┬────────┤   │
│  │ id   │ name   │ dept   │ salary │   │
│  ├──────┼────────┼────────┼────────┤   │
│  │ 1    │ Alice  │ Eng    │ 95000  │   │
│  │ 2    │ Bob    │ Eng    │ 85000  │   │
│  │ 3    │ Charlie│ Mktg   │ 70000  │   │
│  └──────┴────────┴────────┴────────┘   │
│                                         │
│  ROW = One folder (record)              │
│  COLUMN = One type of info (field)      │
│  QUERY = Your question to the DB        │
└─────────────────────────────────────────┘`,
        [
          { line: 'SELECT * FROM employees;', explanation: 'Ask the database to show ALL columns from the employees table. The * means "everything".', result: 'All 10 employee rows are returned with all columns' },
          { line: 'SELECT name, salary FROM employees;', explanation: 'Instead of *, we specify only the columns we care about — name and salary.', result: 'Only name and salary columns shown for all employees' },
          { line: 'SELECT name FROM employees WHERE salary > 80000;', explanation: 'Add a filter — only show employees earning more than 80,000.', result: 'Alice (95000), Bob (85000), Henry (90000), Ivy (92000)' },
        ],
        `-- Your first SQL query!
SELECT name, salary, city
FROM employees
WHERE salary > 80000
ORDER BY salary DESC;`,
        'SQL Query Basics',
        `-- Basic SELECT syntax
SELECT column1, column2, ...
FROM table_name
WHERE condition
ORDER BY column ASC|DESC
LIMIT number;

-- Get everything
SELECT * FROM table_name;

-- Get specific columns
SELECT name, salary FROM employees;

-- Filter with WHERE
SELECT * FROM employees WHERE salary > 80000;

-- Sort results
SELECT * FROM employees ORDER BY salary DESC;`,
        [
          { wrong: `SELECT * FROM employee;`, correct: `SELECT * FROM employees;`, explanation: 'Table names must be exact. If the table is "employees" (plural), "employee" (singular) will cause an error.' },
          { wrong: `SELECT Name FROM employees;`, correct: `SELECT name FROM employees;`, explanation: 'While SQL is case-insensitive for keywords, column name casing depends on the database. Use consistent lowercase for portability.' },
        ],
        { question: 'What does SQL stand for?', options: ['Simple Query Language', 'Structured Query Language', 'Standard Query Logic', 'Sequential Query Language'], answer: 1, explanation: 'SQL stands for Structured Query Language. It was originally called SEQUEL (Structured English Query Language) but was shortened to SQL.' },
        ['Databases', 'Tables', 'Rows', 'Columns', 'Queries', 'RDBMS']
      ),
      T('1.2', 'SELECT Statement', '1',
        `Think of SELECT as your magic wand for asking questions to a database. It's the most powerful and most-used SQL command — you'll use it in practically every query you ever write. The SELECT statement tells the database exactly what information you want to see.\n\nWhen you go to a restaurant, you don't eat everything on the menu — you pick specific dishes. SELECT works the same way. You can ask for all columns using * (like ordering the entire menu), or you can pick specific columns (like ordering specific dishes). Most of the time, you'll want specific columns because it's faster and clearer.\n\nThe basic pattern is always: SELECT [what] FROM [where]. "What" is the columns you want, "where" is the table they live in. You can also add WHERE to filter rows, ORDER BY to sort, LIMIT to restrict how many rows come back, and aliases (AS) to rename columns in your results. Every complex query you'll ever write is just these building blocks combined together.\n\nIn placement interviews, SELECT questions are the warm-up. But don't underestimate them — knowing SELECT inside-out means you can quickly build more complex queries. Interviewers often test if you know the difference between SELECT * and SELECT specific columns, and whether you understand column aliases.`,
        `┌────────────────────────────────────────────┐
│           SELECT: PICK YOUR COLUMNS         │
├────────────────────────────────────────────┤
│                                            │
│  TABLE: employees                          │
│  ┌──────┬────────┬────────┬────────┐       │
│  │ id   │ name   │ dept   │ salary │       │
│  ├──────┼────────┼────────┼────────┤       │
│  │ 1    │ Alice  │ Eng    │ 95000  │       │
│  │ 2    │ Bob    │ Eng    │ 85000  │       │
│  │ 3    │ Charlie│ Mktg   │ 70000  │       │
│  └──────┴────────┴────────┴────────┘       │
│                                            │
│  SELECT name, salary FROM employees;       │
│  ┌────────┬────────┐                       │
│  │ name   │ salary │  ← Only these 2 cols  │
│  ├────────┼────────┤                       │
│  │ Alice  │ 95000  │                       │
│  │ Bob    │ 85000  │                       │
│  │ Charlie│ 70000  │                       │
│  └────────┴────────┘                       │
└────────────────────────────────────────────┘`,
        [
          { line: 'SELECT * FROM employees;', explanation: 'The * means "all columns". This returns every column for every row in the employees table.', result: 'All 10 rows with all 7 columns (emp_id, name, dept_id, salary, hire_date, manager_id, city)' },
          { line: 'SELECT name, salary FROM employees;', explanation: 'Select only the name and salary columns. More efficient than * when you only need specific data.', result: '10 rows with just name and salary columns' },
          { line: 'SELECT name AS employee_name, salary AS pay FROM employees;', explanation: 'Use AS to give columns friendlier names in the output. These aliases only affect display, not the actual table.', result: '10 rows with columns renamed to employee_name and pay' },
          { line: 'SELECT DISTINCT city FROM employees;', explanation: 'DISTINCT removes duplicate values. If 3 employees are in New York, it shows "New York" only once.', result: 'New York, San Francisco, Chicago, Boston (4 unique cities)' },
        ],
        `-- Different SELECT patterns
SELECT * FROM employees;

SELECT name, salary FROM employees;

SELECT name AS employee_name, salary AS pay
FROM employees;

SELECT DISTINCT city FROM employees;

SELECT name, salary, salary * 12 AS annual_salary
FROM employees;`,
        'SELECT Syntax',
        `-- Basic SELECT
SELECT column1, column2 FROM table_name;

-- All columns
SELECT * FROM table_name;

-- With aliases
SELECT name AS employee_name FROM employees;

-- With expressions
SELECT name, salary * 12 AS annual FROM employees;

-- Remove duplicates
SELECT DISTINCT column FROM table_name;

-- Concatenate (varies by DB)
SELECT name || ' - ' || city AS info FROM employees;`,
        [
          { wrong: `SELECT name, salary FROM employees WHERE salary = 95000 ORDER BY;`, correct: `SELECT name, salary FROM employees WHERE salary = 95000 ORDER BY salary;`, explanation: 'ORDER BY must specify which column to sort by. Leaving it blank causes a syntax error.' },
          { wrong: `SELECT name AS "Employee Name" FROM employees ORDER BY Employee Name;`, correct: `SELECT name AS "Employee Name" FROM employees ORDER BY name;`, explanation: 'When using aliases with spaces, you must use the original column name in ORDER BY, not the alias (in most databases).' },
        ],
        { question: 'What does SELECT * FROM employees return?', options: ['Only the first column', 'All columns for all rows', 'The first row only', 'Only unique rows'], answer: 1, explanation: 'The * means "all columns". Combined with no WHERE clause, it returns all columns for every row in the table.' },
        ['SELECT', 'FROM', 'Aliases', 'DISTINCT', 'Expressions']
      ),
      T('1.3', 'WHERE Clause', '1',
        `The WHERE clause is your filter — it's like the search bar on any website. When you search for "red shoes under $50" on an online store, the website uses something like WHERE color = 'red' AND price < 50. Every time you filter anything in a database, you're using WHERE.\n\nWithout WHERE, a SELECT gives you everything in the table. But in the real world, you almost never want everything. You want employees in the Engineering department, orders from last month, students who scored above 90. WHERE is what makes your queries useful and targeted.\n\nWHERE works with comparison operators (=, <, >, <=, >=, <>), logical operators (AND, OR, NOT), and special operators like IN, BETWEEN, LIKE, and IS NULL. You can combine multiple conditions to create very precise filters. In interviews, WHERE is tested in almost every question — from simple single-condition filters to complex multi-condition queries with AND/OR logic.\n\nThe key thing to remember: WHERE filters BEFORE the results are returned. This means it's more efficient than filtering in your application code, because the database only sends you the rows you actually need.`,
        `┌─────────────────────────────────────────────┐
│           WHERE: YOUR DATA FILTER            │
├─────────────────────────────────────────────┤
│  ALL EMPLOYEES:                              │
│  ┌──────┬────────┬────────┬────────┐         │
│  │ id   │ name   │ dept   │ salary │         │
│  ├──────┼────────┼────────┼────────┤         │
│  │ 1    │ Alice  │ Eng    │ 95000  │ ← keep  │
│  │ 2    │ Bob    │ Eng    │ 85000  │ ← keep  │
│  │ 3    │ Charlie│ Mktg   │ 70000  │ ✗ skip  │
│  │ 4    │ Diana  │ Mktg   │ 72000  │ ✗ skip  │
│  │ 5    │ Eve    │ Sales  │ 65000  │ ✗ skip  │
│  └──────┴────────┴────────┴────────┘         │
│                                              │
│  WHERE dept_id = 1                           │
│  ┌──────┬────────┬────────┬────────┐         │
│  │ 1    │ Alice  │ Eng    │ 95000  │         │
│  │ 2    │ Bob    │ Eng    │ 85000  │         │
│  └──────┴────────┴────────┴────────┘         │
└─────────────────────────────────────────────┘`,
        [
          { line: "SELECT * FROM employees WHERE dept_id = 1;", explanation: 'Filter for Engineering department (dept_id = 1). Only rows where dept_id equals 1 are returned.', result: 'Alice, Bob, Ivy (3 rows)' },
          { line: "SELECT * FROM employees WHERE salary > 80000 AND city = 'New York';", explanation: 'Two conditions combined with AND — both must be true. Only employees earning over 80k AND in New York.', result: 'Alice (95000, New York)' },
          { line: "SELECT * FROM employees WHERE city = 'Chicago' OR city = 'Boston';", explanation: 'OR means either condition can be true. Employees in Chicago OR Boston are included.', result: 'Diana (Chicago), Eve (Boston), Henry (Chicago), Ivy (Boston)' },
          { line: "SELECT * FROM employees WHERE city IS NULL;", explanation: 'IS NULL checks for missing/empty values. Cannot use = NULL — it must be IS NULL.', result: 'Jack (his city is NULL)' },
        ],
        `-- WHERE clause examples
SELECT * FROM employees WHERE salary > 80000;

SELECT * FROM employees
WHERE dept_id = 1 AND salary > 90000;

SELECT * FROM employees
WHERE city = 'New York' OR city = 'Chicago';

SELECT * FROM employees WHERE city IS NOT NULL;

SELECT * FROM employees
WHERE salary BETWEEN 60000 AND 80000;`,
        'WHERE Syntax',
        `SELECT columns FROM table_name
WHERE condition;

-- Comparison operators
WHERE column = value
WHERE column > value
WHERE column < value
WHERE column >= value
WHERE column <= value
WHERE column <> value  (not equal)
WHERE column != value  (not equal)

-- Logical operators
WHERE condition1 AND condition2
WHERE condition1 OR condition2
WHERE NOT condition

-- NULL checks
WHERE column IS NULL
WHERE column IS NOT NULL

-- Range
WHERE column BETWEEN low AND high

-- List
WHERE column IN (val1, val2, val3)`,
        [
          { wrong: `SELECT * FROM employees WHERE city = NULL;`, correct: `SELECT * FROM employees WHERE city IS NULL;`, explanation: 'NULL is not a value — it represents the absence of a value. You cannot use = or <> with NULL. Always use IS NULL or IS NOT NULL.' },
          { wrong: `SELECT * FROM employees WHERE dept_id = 1 OR dept_id = 2 AND salary > 70000;`, correct: `SELECT * FROM employees WHERE (dept_id = 1 OR dept_id = 2) AND salary > 70000;`, explanation: 'AND has higher precedence than OR. Without parentheses, it reads as "dept_id=1 OR (dept_id=2 AND salary>70000)" which gives wrong results.' },
        ],
        { question: 'How do you check for NULL values in SQL?', options: ['WHERE column = NULL', 'WHERE column IS NULL', 'WHERE column == NULL', 'WHERE column EQUALS NULL'], answer: 1, explanation: 'NULL is not a value, so = does not work. Use IS NULL to check for NULL values and IS NOT NULL to check for non-NULL values.' },
        ['WHERE', 'AND', 'OR', 'NOT', 'Comparison', 'IS NULL', 'BETWEEN', 'IN']
      ),
      T('1.4', 'ORDER BY', '1',
        `Imagine you're looking at a class of 30 students and want to see who scored the highest. Without sorting, the names appear in whatever order they were inserted — probably random. ORDER BY is how you sort your results, just like sorting a spreadsheet by clicking a column header.\n\nYou can sort in ascending order (A→Z, 1→100) using ASC (the default), or descending order (Z→A, 100→1) using DESC. You can also sort by multiple columns — like sorting employees first by department, then by salary within each department. This is incredibly common in real-world queries.\n\nIn placement interviews, ORDER BY is almost always part of the answer. Questions like "Find the top 3 highest-paid employees" or "List products by category and price" require ORDER BY. It's often combined with LIMIT to get "top N" results — a very common interview pattern.\n\nOne important detail: ORDER BY always goes LAST in a SELECT statement (after WHERE, GROUP BY, HAVING). The database does all the filtering and grouping first, then sorts the final results.`,
        `┌─────────────────────────────────────────┐
│         ORDER BY: SORT YOUR RESULTS      │
├─────────────────────────────────────────┤
│  Unsorted:          Sorted (ASC):        │
│  ┌────────┬───────┐ ┌────────┬───────┐  │
│  │ name   │salary │ │ name   │salary │  │
│  ├────────┼───────┤ ├────────┼───────┤  │
│  │ Alice  │ 95000 │ │ Jack   │ 55000 │  │
│  │ Bob    │ 85000 │ │ Grace  │ 60000 │  │
│  │ Charlie│ 70000 │ │ Eve    │ 65000 │  │
│  │ Diana  │ 72000 │ │ Frank  │ 68000 │  │
│  │ Eve    │ 65000 │ │ Charlie│ 70000 │  │
│  └────────┴───────┘ └────────┴───────┘  │
│                                         │
│  ORDER BY salary ASC  (lowest first)    │
│  ORDER BY salary DESC (highest first)   │
└─────────────────────────────────────────┘`,
        [
          { line: 'SELECT name, salary FROM employees ORDER BY salary DESC;', explanation: 'Sort by salary in descending order. Highest salary appears first.', result: 'Alice(95000), Henry(90000), Ivy(92000), Bob(85000)...' },
          { line: 'SELECT name, dept_id, salary FROM employees ORDER BY dept_id ASC, salary DESC;', explanation: 'Sort by department ascending first, then by salary descending within each department.', result: 'Dept 1: Alice(95000), Ivy(92000), Bob(85000) → Dept 2: Diana(72000), Charlie(70000)...' },
          { line: 'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 3;', explanation: 'Combine ORDER BY with LIMIT to get the top 3 highest-paid employees. Very common interview pattern!', result: 'Alice(95000), Henry(90000), Ivy(92000)' },
        ],
        `-- ORDER BY examples
SELECT name, salary FROM employees
ORDER BY salary DESC;

-- Multi-column sort
SELECT name, dept_id, salary FROM employees
ORDER BY dept_id ASC, salary DESC;

-- Top N pattern
SELECT name, salary FROM employees
ORDER BY salary DESC LIMIT 3;

-- Sort by column position
SELECT name, salary FROM employees
ORDER BY 2 DESC;`,
        'ORDER BY Syntax',
        `SELECT columns FROM table_name
WHERE condition
ORDER BY column1 ASC|DESC, column2 ASC|DESC;

-- ASC is default (ascending: A→Z, 1→100)
-- DESC is descending (Z→A, 100→1)

-- Single column
ORDER BY salary DESC

-- Multiple columns
ORDER BY dept_id ASC, salary DESC

-- By position (1st, 2nd column)
ORDER BY 2 DESC

-- With LIMIT for top N
ORDER BY salary DESC LIMIT 5`,
        [
          { wrong: `SELECT * FROM employees ORDER BY salary DESC, dept_id;`, correct: `SELECT * FROM employees ORDER BY dept_id ASC, salary DESC;`, explanation: 'The order of columns in ORDER BY matters! The first column is the primary sort. If you want department groups with highest salary first, sort by dept_id first.' },
          { wrong: `SELECT * FROM employees WHERE salary > 70000 ORDER BY salary WHERE dept_id = 1;`, correct: `SELECT * FROM employees WHERE salary > 70000 AND dept_id = 1 ORDER BY salary;`, explanation: 'WHERE comes before ORDER BY. You cannot have two WHERE clauses. Combine conditions with AND in a single WHERE clause.' },
        ],
        { question: 'How do you get the 5 highest-paid employees?', options: ['ORDER BY salary LIMIT 5', 'ORDER BY salary DESC LIMIT 5', 'ORDER BY salary ASC LIMIT 5', 'TOP 5 salary'], answer: 1, explanation: 'ORDER BY salary DESC sorts from highest to lowest, then LIMIT 5 keeps only the first 5 rows.' },
        ['ORDER BY', 'ASC', 'DESC', 'LIMIT', 'Multi-column sort']
      ),
      T('1.5', 'LIMIT & OFFSET', '1',
        `When a table has millions of rows, you don't want to return all of them at once — it would be slow and overwhelming. LIMIT controls how many rows you get back, and OFFSET skips a certain number of rows. Together, they're how you build pagination — like "Page 1 shows rows 1-20, Page 2 shows rows 21-40."\n\nThink of it like a Google search results page. Google doesn't show you all 10 million results at once — it shows you 10 at a time. Page 1 is LIMIT 10 OFFSET 0, Page 2 is LIMIT 10 OFFSET 10, Page 3 is LIMIT 10 OFFSET 20, and so on.\n\nIn interviews, LIMIT is commonly used with ORDER BY to get "top N" or "bottom N" results — like "Find the 3 most expensive products" or "Find the 5 most recent orders." OFFSET is less common in interviews but important for real applications that need pagination.\n\nNote: Different databases have slightly different syntax. MySQL/PostgreSQL/SQLite use LIMIT/OFFSET, SQL Server uses TOP or OFFSET-FETCH, and Oracle uses ROWNUM or FETCH FIRST. But the concept is the same everywhere.`,
        `┌─────────────────────────────────────────┐
│      LIMIT & OFFSET: PAGINATION         │
├─────────────────────────────────────────┤
│  Full result (7 rows):                  │
│  ┌────┬────────┬────────┐               │
│  │ #  │ name   │ salary │               │
│  ├────┼────────┼────────┤               │
│  │ 1  │ Alice  │ 95000  │               │
│  │ 2  │ Henry  │ 90000  │               │
│  │ 3  │ Ivy    │ 92000  │               │
│  │ 4  │ Bob    │ 85000  │               │
│  │ 5  │ Diana  │ 72000  │               │
│  │ 6  │ Charlie│ 70000  │               │
│  │ 7  │ Frank  │ 68000  │               │
│  └────┴────────┴────────┘               │
│                                         │
│  LIMIT 3 OFFSET 2  → rows 3,4,5        │
│  ┌────┬────────┬────────┐               │
│  │ 3  │ Ivy    │ 92000  │               │
│  │ 4  │ Bob    │ 85000  │               │
│  │ 5  │ Diana  │ 72000  │               │
│  └────┴────────┴────────┘               │
└─────────────────────────────────────────┘`,
        [
          { line: 'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 5;', explanation: 'Get only the top 5 highest-paid employees. LIMIT restricts the number of rows returned.', result: 'Alice(95000), Henry(90000), Ivy(92000), Bob(85000), Diana(72000)' },
          { line: 'SELECT name, salary FROM employees ORDER BY salary DESC LIMIT 3 OFFSET 2;', explanation: 'Skip the first 2 rows, then take 3. This gives rows 3-5 from the sorted result.', result: 'Ivy(92000), Bob(85000), Diana(72000)' },
          { line: 'SELECT name FROM employees ORDER BY hire_date LIMIT 1;', explanation: 'Find the earliest hired employee. Sort by hire_date ascending, take only 1.', result: 'Charlie (hired 2019-03-20)' },
        ],
        `-- LIMIT and OFFSET
SELECT name, salary FROM employees
ORDER BY salary DESC LIMIT 5;

-- Pagination: Page 2 (rows 6-10)
SELECT name, salary FROM employees
ORDER BY salary DESC LIMIT 5 OFFSET 5;

-- Earliest hired employee
SELECT name, hire_date FROM employees
ORDER BY hire_date ASC LIMIT 1;`,
        'LIMIT & OFFSET Syntax',
        `SELECT columns FROM table_name
ORDER BY column
LIMIT number OFFSET number;

-- LIMIT = max rows to return
-- OFFSET = rows to skip before starting

-- Top N
ORDER BY salary DESC LIMIT 5

-- Pagination (Page N, size S)
LIMIT S OFFSET (N-1) * S

-- Page 1: LIMIT 10 OFFSET 0
-- Page 2: LIMIT 10 OFFSET 10
-- Page 3: LIMIT 10 OFFSET 20`,
        [
          { wrong: `SELECT * FROM employees LIMIT 5 ORDER BY salary DESC;`, correct: `SELECT * FROM employees ORDER BY salary DESC LIMIT 5;`, explanation: 'LIMIT must come AFTER ORDER BY. The correct order is SELECT...FROM...WHERE...ORDER BY...LIMIT.' },
          { wrong: `SELECT * FROM employees OFFSET 5;`, correct: `SELECT * FROM employees LIMIT 10 OFFSET 5;`, explanation: 'OFFSET requires LIMIT to be specified as well. You cannot use OFFSET alone.' },
        ],
        { question: 'How do you get rows 11-20 from a query?', options: ['LIMIT 10 OFFSET 10', 'LIMIT 20 OFFSET 10', 'LIMIT 10 OFFSET 11', 'LIMIT 10 SKIP 10'], answer: 0, explanation: 'LIMIT 10 means take 10 rows, OFFSET 10 means skip the first 10. So rows 11-20 are returned.' },
        ['LIMIT', 'OFFSET', 'Pagination', 'TOP N']
      ),
      T('1.6', 'DISTINCT', '1',
        `When you query a database, you sometimes get duplicate values in the results. DISTINCT is your de-duplication tool — it removes duplicate rows from your result set, showing only unique values. Think of it like removing duplicates from a playlist — you want each song to appear only once.\n\nDISTINCT is particularly useful when you want to know "what are the unique values in this column?" For example, "What cities do our employees live in?" Without DISTINCT, if 3 employees live in New York, you'd see "New York" three times. With DISTINCT, you see it once.\n\nYou can use DISTINCT on single columns or multiple columns. When used on multiple columns, it considers the combination — so DISTINCT city, dept_id would give you unique city-dept combinations. DISTINCT applies to ALL columns in the SELECT list, not just the first one.\n\nIn interviews, DISTINCT often appears in counting questions — "How many unique cities do our employees live in?" would be SELECT COUNT(DISTINCT city). This is a very common pattern that interviewers love to test.`,
        `┌─────────────────────────────────────────┐
│         DISTINCT: REMOVE DUPLICATES      │
├─────────────────────────────────────────┤
│  Without DISTINCT:  With DISTINCT:       │
│  ┌────────┐          ┌────────┐          │
│  │ city   │          │ city   │          │
│  ├────────┤          ├────────┤          │
│  │ New Yo │          │ New Yo │          │
│  │ San Fr │          │ San Fr │          │
│  │ New Yo │  ──→     │ Chicago│          │
│  │ Chicago│          │ Boston │          │
│  │ Boston │          │ NULL   │          │
│  │ San Fr │          └────────┘          │
│  │ New Yo │          (5 unique + NULL)    │
│  │ Chicago│                               │
│  │ Boston │                               │
│  │ NULL   │                               │
│  └────────┘                               │
└─────────────────────────────────────────┘`,
        [
          { line: 'SELECT DISTINCT city FROM employees;', explanation: 'Show only unique city values. Duplicates are removed from the result.', result: 'New York, San Francisco, Chicago, Boston, NULL' },
          { line: 'SELECT DISTINCT dept_id, city FROM employees;', explanation: 'Show unique combinations of dept_id AND city. Both columns together must be unique.', result: '(1,New York), (1,San Francisco), (1,Boston), (2,New York), (2,Chicago), (3,Boston), (3,San Francisco), (3,NULL), (4,New York), (5,Chicago)' },
          { line: 'SELECT COUNT(DISTINCT city) AS unique_cities FROM employees;', explanation: 'Count how many unique cities exist. Very common interview pattern!', result: '4 (New York, San Francisco, Chicago, Boston)' },
        ],
        `-- DISTINCT examples
SELECT DISTINCT city FROM employees;

SELECT DISTINCT dept_id, city FROM employees;

SELECT COUNT(DISTINCT city) AS unique_cities
FROM employees;

SELECT COUNT(DISTINCT dept_id) AS num_departments
FROM employees;`,
        'DISTINCT Syntax',
        `-- Single column
SELECT DISTINCT column FROM table_name;

-- Multiple columns (unique combinations)
SELECT DISTINCT col1, col2 FROM table_name;

-- Count unique values
SELECT COUNT(DISTINCT column) FROM table_name;

-- DISTINCT with NULL
-- NULL is treated as one distinct value`,
        [
          { wrong: `SELECT DISTINCT(city), name FROM employees;`, correct: `SELECT DISTINCT city, name FROM employees;`, explanation: 'DISTINCT applies to ALL columns in the SELECT list, not just one. Parentheses around one column do not change this behavior.' },
          { wrong: `SELECT COUNT(DISTINCT city, dept_id) FROM employees;`, correct: `SELECT COUNT(*) FROM (SELECT DISTINCT city, dept_id FROM employees);`, explanation: 'COUNT(DISTINCT) only works with a single column. For multiple columns, use a subquery with DISTINCT and then COUNT.' },
        ],
        { question: 'What does SELECT COUNT(DISTINCT city) return?', options: ['Total number of rows', 'Number of unique cities', 'Number of NULL cities', 'Number of duplicate cities'], answer: 1, explanation: 'COUNT(DISTINCT column) counts the number of unique non-NULL values in that column.' },
        ['DISTINCT', 'COUNT DISTINCT', 'Unique values', 'De-duplication']
      ),
      T('1.7', 'Aliases (AS)', '1',
        `Aliases are like nicknames for your columns and tables. When a column is called "emp_id" but you want your results to show "Employee ID", an alias makes that happen. When a table is called "employees" but you're joining it to itself and need two copies, aliases let you distinguish them.\n\nColumn aliases make your query results more readable — instead of seeing "salary * 12" as a column header, you can make it show "annual_salary". Table aliases save typing in complex queries — instead of writing "employees" 5 times in a JOIN, you write "e" once and use "e." everywhere.\n\nThe AS keyword is optional for aliases — "salary AS annual" and "salary annual" do the same thing. However, using AS is a best practice because it makes your code clearer. If your alias contains spaces, you must wrap it in double quotes: AS "Annual Salary".\n\nIn interviews, aliases are essential for JOINs and subqueries. You can't write complex queries without them. They're also important for making your output readable — interviewers appreciate clear, well-named columns in results.`,
        `┌───────────────────────────────────────────┐
│         ALIASES: NICKNAMES FOR COLUMNS     │
├───────────────────────────────────────────┤
│                                           │
│  Without alias:        With alias:        │
│  ┌──────────┬─────────┐ ┌────────┬──────┐│
│  │ name     │salary*12│ │ Employee│Annual ││
│  ├──────────┼─────────┤ ├────────┼──────┤│
│  │ Alice    │ 1140000 │ │ Alice  │1.14M ││
│  │ Bob      │ 1020000 │ │ Bob   │1.02M ││
│  └──────────┴─────────┘ └────────┴──────┘│
│                                           │
│  salary * 12 AS annual_salary             │
│  e.salary (table alias)                   │
└───────────────────────────────────────────┘`,
        [
          { line: 'SELECT name AS employee_name, salary * 12 AS annual_salary FROM employees;', explanation: 'Rename columns in the output. salary * 12 shows as "annual_salary" instead of a long expression.', result: 'Columns named employee_name and annual_salary with computed values' },
          { line: 'SELECT e.name, e.salary, d.dept_name FROM employees e JOIN departments d ON e.dept_id = d.dept_id;', explanation: 'Table aliases: "e" for employees, "d" for departments. Makes JOINs much cleaner.', result: 'Combined data with readable short prefixes' },
          { line: 'SELECT name AS "Employee Name", salary AS "Monthly Pay ($)" FROM employees;', explanation: 'Aliases with spaces need double quotes. Useful for reports and display.', result: 'Columns show as "Employee Name" and "Monthly Pay ($)"' },
        ],
        `-- Column aliases
SELECT name AS employee_name,
       salary * 12 AS annual_salary
FROM employees;

-- Table aliases (crucial for JOINs)
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id;

-- Aliases with spaces
SELECT name AS "Employee Name",
       salary AS "Monthly Pay"
FROM employees;`,
        'Alias Syntax',
        `-- Column alias
SELECT column AS alias_name
SELECT expression AS alias_name
SELECT column alias_name  -- AS is optional

-- Table alias
FROM table_name alias_name
FROM employees e

-- Aliases with spaces/special chars
SELECT column AS "My Column Name"

-- Use in ORDER BY (not WHERE)
SELECT salary * 12 AS annual
FROM employees
ORDER BY annual DESC;  -- OK in ORDER BY`,
        [
          { wrong: `SELECT name AS employee_name FROM employees WHERE employee_name = 'Alice';`, correct: `SELECT name AS employee_name FROM employees WHERE name = 'Alice';`, explanation: 'Column aliases cannot be used in WHERE because WHERE executes before SELECT. Use the original column name in WHERE.' },
          { wrong: `SELECT e.name FROM employees;`, correct: `SELECT employees.name FROM employees;`, correct2: `SELECT e.name FROM employees e;`, explanation: 'If you use a table alias, you must define it in the FROM clause. "e" is not recognized unless you write "FROM employees e".' },
        ],
        { question: 'Can you use a column alias in the WHERE clause?', options: ['Yes, always', 'No, aliases are not available in WHERE', 'Only in MySQL', 'Only with AS keyword'], answer: 1, explanation: 'WHERE executes before SELECT, so column aliases defined in SELECT are not yet available. Use the original column name in WHERE.' },
        ['AS', 'Column aliases', 'Table aliases', 'Readability']
      ),
      T('1.8', 'Comments in SQL', '1',
        `Comments are notes you write in your SQL code that the database ignores. They're like sticky notes on your code — they help you and others understand what the code does, why it does it, and any important details. Good commenting is a sign of a professional developer.\n\nThere are two types of SQL comments: single-line (--) and multi-line (/* */). Single-line comments start with -- and continue to the end of the line. Multi-line comments start with /* and end with */, spanning multiple lines. Both are essential for writing clean, maintainable code.\n\nIn interviews, you won't usually write comments during a test, but if you're explaining your approach to the interviewer, mentioning that you'd add comments shows professionalism. In real projects, well-commented SQL is critical because complex queries can be hard to understand months later.\n\nComments are also useful for temporarily disabling code during debugging — you can "comment out" a line instead of deleting it, so you can easily bring it back later.`,
        `┌─────────────────────────────────────────┐
│        COMMENTS: NOTES IN YOUR SQL       │
├─────────────────────────────────────────┤
│                                         │
│  -- Single line comment                 │
│  SELECT name, salary  -- get these cols │
│  FROM employees;                        │
│                                         │
│  /* Multi-line comment                  │
│     This query finds the top earners    │
│     in each department                  │
│  */                                     │
│  SELECT * FROM employees;              │
└─────────────────────────────────────────┘`,
        [
          { line: '-- This is a single-line comment', explanation: 'Everything after -- on that line is ignored by the database.', result: 'No output - comment only' },
          { line: 'SELECT name --, salary\nFROM employees;', explanation: 'You can comment out part of a line. Here salary is commented out.', result: 'Only name column returned' },
          { line: '/* This is a\nmulti-line comment\nspanning several lines */', explanation: 'Multi-line comments wrap from /* to */. Everything between is ignored.', result: 'No output - comment only' },
        ],
        `-- SQL Comments

-- Single-line comment (everything after -- is ignored)
SELECT name, salary FROM employees;

-- Comment out part of a line
SELECT name --, salary
FROM employees;

/* Multi-line comment
   Use this for longer explanations
   or for commenting out multiple lines */
SELECT * FROM employees;`,
        'Comment Syntax',
        `-- Single-line comment (most common)
-- Everything after -- is ignored to end of line

SELECT name -- inline comment
FROM employees;

/* Multi-line comment
   Can span multiple lines
   Everything between /* and */ is ignored */

-- Quick disable a line:
-- SELECT * FROM old_table;`,
        [
          { wrong: `// This is a comment`, correct: `-- This is a comment`, explanation: 'SQL uses -- for single-line comments, not // (which is JavaScript/C++ style). Some databases also support # but -- is the SQL standard.' },
          { wrong: `/* Unclosed comment`, correct: `/* Properly closed comment */`, explanation: 'Multi-line comments must be closed with */. An unclosed comment will cause the rest of your query to be ignored, resulting in errors or empty results.' },
        ],
        { question: 'How do you write a single-line comment in SQL?', options: ['// comment', '# comment', '-- comment', '/* comment */'], answer: 2, explanation: 'SQL uses -- for single-line comments. /* */ is for multi-line. // and # are not standard SQL comment syntax.' },
        ['Single-line comments', 'Multi-line comments', 'Documentation']
      ),
      T('1.9', 'Data Types in SQL', '1',
        `Every piece of data in a SQL database has a type — just like how you know that a phone number is digits, a name is text, and a birthday is a date. Data types tell the database what kind of data to expect in each column, which enables it to store data efficiently and validate inputs.\n\nThe main categories are: INTEGER/INT (whole numbers like 42), REAL/FLOAT/DECIMAL (decimal numbers like 99.99), TEXT/VARCHAR (strings like "Hello"), DATE (dates like "2024-01-15"), BOOLEAN (true/false), and BLOB (binary data like images). Different databases use slightly different names, but the concepts are the same.\n\nUnderstanding data types is crucial because they affect what operations you can perform. You can do math on INTEGER and DECIMAL columns, but not on TEXT. You can use string functions on TEXT, but not on numbers (unless you cast them first). Date types support date arithmetic but not regular math.\n\nIn interviews, data type awareness shows up when you need to convert between types (using CAST), when comparing values of different types, or when designing table schemas. Knowing that salary should be DECIMAL(10,2) not INTEGER shows you understand precision in financial data.`,
        `┌──────────────────────────────────────────────┐
│          DATA TYPES: WHAT KIND OF DATA?       │
├──────────────────────────────────────────────┤
│                                              │
│  NUMERIC       TEXT        DATE/TIME         │
│  ┌──────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ INTEGER  │ │ TEXT    │ │ DATE         │  │
│  │ 42       │ │ "Alice" │ │ 2024-01-15   │  │
│  │ REAL     │ │ VARCHAR │ │ TIME         │  │
│  │ 99.99    │ │ (n)     │ │ 14:30:00     │  │
│  │ DECIMAL  │ │ "Hi!"   │ │ DATETIME     │  │
│  │ 19.99    │ │         │ │ TIMESTAMP    │  │
│  └──────────┘ └─────────┘ └──────────────┘  │
│                                              │
│  OTHER: BOOLEAN, BLOB, NULL, JSON           │
└──────────────────────────────────────────────┘`,
        [
          { line: 'SELECT name, salary + 1000 AS salary_plus_bonus FROM employees;', explanation: 'INTEGER columns support arithmetic. salary is an INTEGER, so + works.', result: 'Each salary increased by 1000 in the output' },
          { line: "SELECT name || ' works in ' || city AS info FROM employees WHERE city IS NOT NULL;", explanation: 'TEXT columns support concatenation (|| operator in SQLite). Combines strings.', result: 'Alice works in New York, Bob works in San Francisco...' },
          { line: "SELECT CAST(salary AS TEXT) || ' USD' AS salary_text FROM employees LIMIT 3;", explanation: 'CAST converts between types. Here INTEGER salary becomes TEXT so we can append " USD".', result: '95000 USD, 85000 USD, 70000 USD' },
        ],
        `-- Data types in action
SELECT name, salary + 1000 AS with_bonus
FROM employees;

-- String concatenation
SELECT name || ' - ' || city AS info
FROM employees WHERE city IS NOT NULL;

-- Type casting
SELECT CAST(salary AS TEXT) || ' USD' AS salary_text
FROM employees LIMIT 3;`,
        'SQL Data Types',
        `-- Common Data Types:
INTEGER / INT    -- Whole numbers: 42, 1000
REAL / FLOAT     -- Decimals: 3.14, 99.99
DECIMAL(p,s)     -- Precise: DECIMAL(10,2) = 99999999.99
TEXT / VARCHAR(n) -- Strings: 'Hello', 'Alice'
DATE             -- Date: '2024-01-15'
TIME             -- Time: '14:30:00'
DATETIME         -- Both: '2024-01-15 14:30:00'
BOOLEAN          -- True/False (0/1 in SQLite)
BLOB             -- Binary data (images, files)
NULL             -- Missing/unknown value

-- Type conversion
CAST(expression AS type)
CAST('123' AS INTEGER)
CAST(salary AS TEXT)`,
        [
          { wrong: `SELECT * FROM employees WHERE name = 95000;`, correct: `SELECT * FROM employees WHERE salary = 95000;`, explanation: 'Comparing a TEXT column (name) to a number (95000) may give unexpected results. Compare numbers to number columns, strings to text columns.' },
          { wrong: `SELECT salary + ' dollars' FROM employees;`, correct: `SELECT CAST(salary AS TEXT) || ' dollars' FROM employees;`, explanation: 'You cannot directly add a string to a number. Cast the number to text first, then concatenate.' },
        ],
        { question: 'Which data type should you use for storing currency values?', options: ['INTEGER', 'REAL', 'DECIMAL(10,2)', 'TEXT'], answer: 2, explanation: 'DECIMAL(p,s) provides exact precision for money. REAL/FLOAT can have rounding errors. DECIMAL(10,2) stores up to 99999999.99 exactly.' },
        ['INTEGER', 'TEXT', 'REAL', 'DATE', 'CAST', 'Type conversion']
      ),
      T('1.10', 'NULL Values', '1',
        `NULL is one of the trickiest concepts in SQL. It doesn't mean zero, it doesn't mean empty string, and it doesn't mean false. NULL means "unknown" or "not applicable" — it's the absence of a value. Think of it like a form where someone left a field blank — you don't know if they forgot, if it doesn't apply to them, or if they chose not to answer.\n\nThe biggest gotcha with NULL is that it doesn't behave like a normal value. NULL = NULL is NOT true (because two unknowns aren't necessarily the same unknown). NULL <> 1 is also not true (because the unknown might or might not be 1). Any arithmetic with NULL gives NULL (5 + NULL = NULL). Any comparison with NULL gives NULL (which is treated as false in WHERE).\n\nTo check for NULL, you must use IS NULL or IS NOT NULL — never = NULL or <> NULL. To handle NULLs in calculations, use COALESCE (returns the first non-NULL value) or IFNULL. For comparisons that might involve NULL, use ISNULL or COALESCE to provide defaults.\n\nIn interviews, NULL handling is a very common test. Questions like "Find employees without a manager" (WHERE manager_id IS NULL) or "Replace NULL cities with 'Unknown'" (COALESCE(city, 'Unknown')) appear frequently.`,
        `┌──────────────────────────────────────────┐
│         NULL: THE UNKNOWN VALUE           │
├──────────────────────────────────────────┤
│                                          │
│  NULL ≠ 0     NULL ≠ '' (empty string)  │
│  NULL ≠ FALSE NULL = UNKNOWN             │
│                                          │
│  Expression         Result               │
│  ─────────          ──────               │
│  5 + NULL        →  NULL                 │
│  NULL = NULL     →  NULL (not TRUE!)     │
│  NULL <> 1       →  NULL (not TRUE!)     │
│  NULL IS NULL    →  TRUE  ✓              │
│                                          │
│  COALESCE(NULL, 'hi') → 'hi'            │
│  IFNULL(NULL, 0)       → 0               │
└──────────────────────────────────────────┘`,
        [
          { line: 'SELECT * FROM employees WHERE city IS NULL;', explanation: 'Find rows where city is NULL. MUST use IS NULL, not = NULL.', result: 'Jack (his city is NULL)' },
          { line: "SELECT name, COALESCE(city, 'Unknown') AS city FROM employees;", explanation: 'COALESCE returns the first non-NULL value. If city is NULL, shows "Unknown" instead.', result: 'All employees listed, Jack shows "Unknown" for city' },
          { line: 'SELECT name, salary + COALESCE(bonus, 0) AS total FROM employees;', explanation: 'Arithmetic with NULL gives NULL. Use COALESCE to provide a default value (0) when the column is NULL.', result: 'All employees get a total (NULL bonus treated as 0)' },
        ],
        `-- NULL handling
SELECT * FROM employees WHERE city IS NULL;

SELECT name, COALESCE(city, 'Unknown') AS city
FROM employees;

SELECT name, IFNULL(city, 'N/A') AS city
FROM employees;

-- NULL in calculations
SELECT name, salary + COALESCE(bonus, 0) AS total
FROM employees;

-- Count non-NULL values
SELECT COUNT(city), COUNT(*) FROM employees;`,
        'NULL Handling',
        `-- Checking for NULL
WHERE column IS NULL      -- has no value
WHERE column IS NOT NULL  -- has a value

-- NEVER use these (they don't work):
WHERE column = NULL   -- ✗ WRONG
WHERE column <> NULL  -- ✗ WRONG

-- Replacing NULLs
COALESCE(col, default)  -- first non-NULL
IFNULL(col, default)    -- SQLite specific

-- NULL in expressions
5 + NULL = NULL   -- any math with NULL = NULL
NULL OR TRUE = TRUE
NULL AND TRUE = NULL

-- COUNT behavior
COUNT(*)      -- counts all rows (including NULLs)
COUNT(column) -- counts non-NULL values only`,
        [
          { wrong: `SELECT * FROM employees WHERE city = NULL;`, correct: `SELECT * FROM employees WHERE city IS NULL;`, explanation: '= NULL does not work because NULL is not a value that can be compared. Always use IS NULL or IS NOT NULL.' },
          { wrong: `SELECT COUNT(city) FROM employees; -- counts all employees`, correct: `SELECT COUNT(*) FROM employees; -- counts all employees`, explanation: 'COUNT(column) counts only non-NULL values in that column. COUNT(*) counts all rows regardless of NULLs.' },
        ],
        { question: 'What does 5 + NULL return in SQL?', options: ['5', '0', 'NULL', 'Error'], answer: 2, explanation: 'Any arithmetic operation with NULL returns NULL, because NULL represents an unknown value. Adding something to unknown gives unknown.' },
        ['IS NULL', 'IS NOT NULL', 'COALESCE', 'IFNULL', 'Three-valued logic']
      ),
      T('1.11', 'Expressions & Operators', '1',
        `SQL expressions let you calculate new values from existing data. Just like in a spreadsheet where you can write =A2*B2 to multiply two cells, SQL lets you write salary * 12 to compute annual salary, or price * quantity to compute total cost. Expressions make your queries dynamic and powerful.\n\nSQL supports arithmetic operators (+, -, *, /, %), comparison operators (=, <, >, <=, >=, <>, !=), logical operators (AND, OR, NOT), and string operators (|| for concatenation). You can use these in SELECT, WHERE, ORDER BY, and HAVING clauses.\n\nThe modulo operator (%) gives the remainder after division — useful for finding odd/even numbers, cycling through values, or grouping rows. String concatenation (|| in standard SQL, CONCAT() function in MySQL) combines text values. Comparison operators return TRUE, FALSE, or NULL, which is why understanding NULL behavior is so important.\n\nIn interviews, expressions show up everywhere — from simple calculations like "find the total order amount" to complex conditions like "find employees whose salary is above the department average." Mastering operators is foundational to writing any non-trivial query.`,
        `┌───────────────────────────────────────────┐
│     EXPRESSIONS & OPERATORS               │
├───────────────────────────────────────────┤
│  Arithmetic:  +  -  *  /  %              │
│  Comparison:  =  <  >  <=  >=  <>  !=    │
│  Logical:     AND  OR  NOT               │
│  String:      || (concatenation)          │
│                                           │
│  salary * 12     → annual salary          │
│  salary % 1000   → last 3 digits          │
│  name || ' Jr.'  → name with suffix      │
│  price * qty     → total cost             │
└───────────────────────────────────────────┘`,
        [
          { line: 'SELECT name, salary * 12 AS annual, salary / 1000 AS salary_k FROM employees;', explanation: 'Arithmetic expressions in SELECT. * for multiply, / for divide. Results get computed for each row.', result: 'Alice: annual=1140000, salary_k=95; Bob: annual=1020000, salary_k=85...' },
          { line: "SELECT name || ' (' || city || ')' AS info FROM employees WHERE city IS NOT NULL;", explanation: 'String concatenation with ||. Combines multiple text values into one.', result: 'Alice (New York), Bob (San Francisco), Charlie (New York)...' },
          { line: 'SELECT name, salary FROM employees WHERE salary % 10000 = 0;', explanation: 'Modulo operator gives remainder. salary % 10000 = 0 finds salaries that are exact multiples of 10000.', result: 'Alice (95000 — 95000%10000=5000, not 0)... might return no rows or specific ones' },
        ],
        `-- Arithmetic expressions
SELECT name, salary * 12 AS annual,
       salary / 1000 AS salary_k
FROM employees;

-- String concatenation
SELECT name || ' (' || city || ')' AS info
FROM employees WHERE city IS NOT NULL;

-- Modulo (remainder)
SELECT name, salary
FROM employees WHERE salary % 2 = 0;

-- Complex expressions
SELECT name,
  CASE WHEN salary > 80000 THEN 'High'
       WHEN salary > 60000 THEN 'Medium'
       ELSE 'Low' END AS level
FROM employees;`,
        'SQL Operators',
        `-- Arithmetic
+  addition       salary + bonus
-  subtraction    salary - tax
*  multiplication salary * 12
/  division       salary / 12
%  modulo         id % 2 (odd/even)

-- Comparison (in WHERE/HAVING)
=   equal         dept_id = 1
<>  not equal     dept_id <> 1
<   less than     salary < 50000
>   greater than  salary > 80000
<=  less/equal    salary <= 80000
>=  greater/equal salary >= 80000

-- Logical
AND  both true    salary > 80000 AND dept = 1
OR   either true  city = 'NY' OR city = 'LA'
NOT  opposite     NOT (salary > 80000)

-- String
||   concatenate  name || ' Smith'`,
        [
          { wrong: `SELECT name FROM employees WHERE salary / 0 FROM employees;`, correct: `SELECT name, salary / 12 AS monthly FROM employees WHERE salary > 0;`, explanation: 'Division by zero causes an error. Always ensure the divisor is non-zero, especially when dividing by a column that could contain 0.' },
          { wrong: `SELECT name + ' Smith' FROM employees;`, correct: `SELECT name || ' Smith' FROM employees;`, explanation: '+ is for numbers, not strings. Use || for string concatenation in standard SQL, or CONCAT() in MySQL.' },
        ],
        { question: 'What does the % (modulo) operator return?', options: ['Percentage', 'Quotient after division', 'Remainder after division', 'Division result'], answer: 2, explanation: 'The % operator returns the remainder after division. For example, 17 % 5 = 2 (because 17 = 5*3 + 2).' },
        ['Arithmetic', 'Comparison', 'Logical', 'String operators', 'Expressions']
      ),
      T('1.12', 'SQL Syntax Rules', '1',
        `Every language has grammar rules, and SQL is no different. Understanding SQL's syntax rules helps you write correct queries and debug errors quickly. Most SQL errors in interviews come from syntax mistakes — missing commas, wrong keyword order, or unmatched parentheses.\n\nKey rules: SQL keywords are case-insensitive (SELECT = select = SeLeCt), but table/column names might be case-sensitive depending on the database. String literals must be in single quotes ('Alice'), not double quotes. Each statement ends with a semicolon (;). The order of clauses is fixed: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT.\n\nWhitespace and line breaks don't matter — you can write a query on one line or spread across 20 lines. However, good formatting makes code readable. Indent subqueries, align columns in SELECT, and put each clause on a new line.\n\nIn interviews, you'll often write SQL on a whiteboard or in a text editor without syntax highlighting. Knowing the rules means you can write correct SQL from memory. Common mistakes include: forgetting commas between columns, using single quotes for column names, putting WHERE after GROUP BY, and forgetting the semicolon.`,
        `┌─────────────────────────────────────────────┐
│         SQL SYNTAX RULES                     │
├─────────────────────────────────────────────┤
│  ✅ Correct order:                           │
│  SELECT → FROM → WHERE → GROUP BY →         │
│  HAVING → ORDER BY → LIMIT                  │
│                                             │
│  String literals: 'single quotes'           │
│  Column aliases: AS "My Column"             │
│  Statement end: semicolon (;)               │
│  Keywords: case-INSENSITIVE                 │
│  Commas: between columns in SELECT          │
│  No comma: before FROM or WHERE             │
└─────────────────────────────────────────────┘`,
        [
          { line: "SELECT name, salary FROM employees WHERE city = 'New York' ORDER BY salary DESC;", explanation: 'Complete query following correct clause order: SELECT, FROM, WHERE, ORDER BY.', result: 'Employees in New York sorted by salary descending' },
          { line: "select name, salary from employees where city = 'New York';", explanation: 'Keywords are case-insensitive. This works the same as uppercase keywords.', result: 'Same result as uppercase version' },
          { line: "SELECT name, salary FROM employees WHERE name = 'Alice';", explanation: 'String values use single quotes. This compares the name column to the string Alice.', result: 'Alice row returned' },
        ],
        `-- Correct SQL structure
SELECT name, salary       -- what to show
FROM employees            -- where from
WHERE salary > 70000      -- filter rows
GROUP BY dept_id          -- group (optional)
HAVING COUNT(*) > 1       -- filter groups (optional)
ORDER BY salary DESC      -- sort order
LIMIT 10;                 -- max rows

-- Keywords are case-insensitive
select name from employees;  -- works

-- Strings use single quotes
WHERE name = 'Alice'         -- ✓ correct
WHERE name = "Alice"         -- ✗ varies by DB`,
        'SQL Syntax Quick Reference',
        `-- Clause order (MUST follow this):
SELECT columns
FROM table
WHERE condition
GROUP BY column
HAVING group_condition
ORDER BY column
LIMIT number;

-- Quotes:
'String value'     -- single quotes for values
"Column Name"      -- double quotes for identifiers
\`column_name\`     -- backticks (MySQL)

-- Semicolons:
-- End each statement with ;

-- Commas:
-- Separate columns: SELECT a, b, c
-- No comma before FROM

-- Comments:
-- Single line
/* Multi-line */`,
        [
          { wrong: `SELECT name salary FROM employees;`, correct: `SELECT name, salary FROM employees;`, explanation: 'Comma is required between columns in SELECT. Without it, "salary" is interpreted as an alias for "name".' },
          { wrong: `SELECT * FROM employees ORDER BY salary WHERE dept_id = 1;`, correct: `SELECT * FROM employees WHERE dept_id = 1 ORDER BY salary;`, explanation: 'WHERE must come before ORDER BY. The clause order is fixed: FROM → WHERE → ORDER BY.' },
        ],
        { question: 'What is the correct order of SQL clauses?', options: ['SELECT, ORDER BY, WHERE, FROM', 'SELECT, FROM, WHERE, ORDER BY', 'FROM, SELECT, WHERE, ORDER BY', 'SELECT, WHERE, FROM, ORDER BY'], answer: 1, explanation: 'The fixed order is: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT. This is how SQL processes the query.' },
        ['Syntax rules', 'Clause order', 'Quotes', 'Semicolons', 'Formatting']
      ),
    ]
  },
  // ==========================================
  // PHASE 2: Filtering & Conditions
  // ==========================================
  {
    id: '2', title: 'Filtering & Conditions', icon: '🔍',
    topics: [
      T('2.1', 'Comparison Operators', '2',
        `Comparison operators are the bread and butter of filtering data. They let you compare values in your database to find exactly what you need. Think of them as the =, <, > signs you learned in math class, but now they work on entire columns of data at once.\n\nThe six comparison operators are: = (equal), <> or != (not equal), < (less than), > (greater than), <= (less than or equal), >= (greater than or equal). Every row where the comparison is TRUE gets included in your results. Rows where it's FALSE or NULL get excluded.\n\nAn important subtlety: comparing with NULL always gives NULL (not TRUE or FALSE), which is why NULL rows get excluded from every comparison. This trips up many beginners. If you want to include NULL values, you must explicitly add OR column IS NULL.\n\nIn placement interviews, comparison operators are tested in practically every SQL question. Questions like "Find employees earning more than 80,000" or "Find products priced between 50 and 100" are the building blocks of more complex queries.`,
        `┌────────────────────────────────────────┐
│     COMPARISON OPERATORS                │
├────────────────────────────────────────┤
│  =   Equal to          5 = 5  → TRUE   │
│  <>  Not equal to      5 <> 3 → TRUE   │
│  <   Less than         3 < 5  → TRUE   │
│  >   Greater than      5 > 3  → TRUE   │
│  <=  Less or equal     5 <= 5 → TRUE   │
│  >=  Greater or equal  5 >= 5 → TRUE   │
│                                        │
│  NULL comparisons → always NULL         │
│  NULL = 5    → NULL (not TRUE!)        │
│  NULL <> 5   → NULL (not TRUE!)        │
└────────────────────────────────────────┘`,
        [
          { line: 'SELECT name, salary FROM employees WHERE salary >= 85000;', explanation: 'Greater than or equal to. Finds employees earning 85,000 or more.', result: 'Alice(95000), Bob(85000), Henry(90000), Ivy(92000)' },
          { line: 'SELECT name, salary FROM employees WHERE salary <> 70000;', explanation: 'Not equal to. Excludes rows where salary is exactly 70,000.', result: 'All employees except Charlie(70000)' },
          { line: "SELECT name, hire_date FROM employees WHERE hire_date < '2020-01-01';", explanation: 'Comparison works on dates too! Earlier dates are "less than" later dates.', result: 'Charlie(2019-03-20), Henry(2019-07-01)' },
        ],
        `-- Comparison operators
SELECT name, salary FROM employees WHERE salary >= 85000;

SELECT name FROM employees WHERE dept_id <> 1;

SELECT name, hire_date FROM employees
WHERE hire_date < '2020-01-01';

-- Comparing with NULL (doesn't work!)
SELECT * FROM employees WHERE city <> NULL; -- WRONG
SELECT * FROM employees WHERE city IS NOT NULL; -- CORRECT`,
        'Comparison Operators',
        `=   Equal              WHERE salary = 50000
<>  Not equal           WHERE dept_id <> 1
!=  Not equal (alt)     WHERE dept_id != 1
<   Less than           WHERE salary < 50000
>   Greater than        WHERE salary > 50000
<=  Less or equal       WHERE salary <= 50000
>=  Greater or equal    WHERE salary >= 50000

-- Works with numbers, strings, dates
WHERE name = 'Alice'
WHERE hire_date > '2020-01-01'

-- NULL comparisons always return NULL
WHERE column = NULL   -- ✗ WRONG
WHERE column IS NULL  -- ✓ CORRECT`,
        [
          { wrong: `SELECT * FROM employees WHERE salary != NULL;`, correct: `SELECT * FROM employees WHERE salary IS NOT NULL;`, explanation: 'Comparing with NULL using != does not work. NULL is not a value, so you must use IS NOT NULL.' },
          { wrong: `SELECT * FROM employees WHERE name > 5;`, correct: `SELECT * FROM employees WHERE LENGTH(name) > 5;`, explanation: 'Comparing a TEXT column to a number gives unexpected results. Use appropriate functions for the data type.' },
        ],
        { question: 'What does WHERE salary <> 50000 return?', options: ['Only NULL salaries', 'All salaries except 50000', 'Only salaries equal to 50000', 'All rows regardless of salary'], answer: 1, explanation: '<> means "not equal to". It returns all rows where salary is not 50000. Rows with NULL salary are excluded (NULL <> 50000 is NULL, not TRUE).' },
        ['=', '<>', '!=', '<', '>', '<=', '>=', 'NULL comparison']
      ),
      // Due to size, I'll include abbreviated remaining topics and expand later
      T('2.2', 'Logical Operators (AND, OR, NOT)', '2',
        `Logical operators combine multiple conditions into powerful filters. AND requires ALL conditions to be true, OR requires ANY condition to be true, and NOT reverses a condition. Think of them like filters at airport security: AND = "must pass ALL checks", OR = "any one check is enough", NOT = "must NOT trigger this check".\n\nThe biggest gotcha is operator precedence: AND is evaluated before OR. This means "A OR B AND C" is interpreted as "A OR (B AND C)", not "(A OR B) AND C". Always use parentheses when mixing AND and OR to make your intent clear.\n\nNOT can be used with any condition: NOT IN, NOT BETWEEN, NOT LIKE, IS NOT NULL, NOT EXISTS. In most cases, you can rewrite a NOT condition positively (e.g., <> instead of NOT =, IS NOT NULL instead of NOT IS NULL), but sometimes NOT makes the logic clearer.\n\nIn interviews, AND/OR logic is tested heavily. Questions like "Find employees in Engineering earning over 80,000 who were hired after 2020" require combining three conditions with AND.`,
        `┌──────────────────────────────────────────────┐
│       LOGICAL OPERATORS                       │
├──────────────────────────────────────────────┤
│  AND: ALL conditions must be TRUE             │
│  ┌──────────────────────────┐                │
│  │ cond1 ✓ AND cond2 ✓ → ✓ │                │
│  │ cond1 ✓ AND cond2 ✗ → ✗ │                │
│  │ cond1 ✗ AND cond2 ✓ → ✗ │                │
│  └──────────────────────────┘                │
│                                               │
│  OR: ANY condition must be TRUE               │
│  ┌──────────────────────────┐                │
│  │ cond1 ✓ OR  cond2 ✓ → ✓ │                │
│  │ cond1 ✓ OR  cond2 ✗ → ✓ │                │
│  │ cond1 ✗ OR  cond2 ✓ → ✓ │                │
│  └──────────────────────────┘                │
│                                               │
│  NOT: Reverses the condition                  │
│  NOT TRUE → FALSE, NOT FALSE → TRUE          │
│                                               │
│  PRECEDENCE: AND before OR!                   │
│  A OR B AND C = A OR (B AND C)              │
└──────────────────────────────────────────────┘`,
        [
          { line: "SELECT * FROM employees WHERE dept_id = 1 AND salary > 90000;", explanation: 'AND: both conditions must be true. Engineering (dept 1) AND salary > 90000.', result: 'Alice(95000) and Ivy(92000)' },
          { line: "SELECT * FROM employees WHERE city = 'New York' OR city = 'Chicago';", explanation: 'OR: either condition works. In New York OR Chicago.', result: 'Alice, Charlie, Grace, Diana, Henry' },
          { line: "SELECT * FROM employees WHERE NOT dept_id = 1;", explanation: 'NOT reverses the condition. Everyone NOT in department 1.', result: 'Charlie, Diana, Eve, Frank, Grace, Henry, Jack' },
        ],
        `-- AND: all conditions must match
SELECT * FROM employees
WHERE dept_id = 1 AND salary > 90000;

-- OR: any condition can match
SELECT * FROM employees
WHERE city = 'New York' OR city = 'Chicago';

-- NOT: reverse the condition
SELECT * FROM employees
WHERE NOT dept_id = 1;

-- Parentheses matter!
SELECT * FROM employees
WHERE (dept_id = 1 OR dept_id = 2)
  AND salary > 70000;`,
        'Logical Operators',
        `-- AND: all must be true
WHERE cond1 AND cond2 AND cond3

-- OR: any must be true
WHERE cond1 OR cond2 OR cond3

-- NOT: reverse
WHERE NOT condition
WHERE column NOT IN (...)
WHERE column NOT BETWEEN a AND b
WHERE column NOT LIKE '...'

-- PRECEDENCE: AND before OR!
-- Use parentheses to be explicit:
WHERE (A OR B) AND C  -- ✓ clear
WHERE A OR (B AND C)  -- ✓ clear
WHERE A OR B AND C    -- ✗ ambiguous`,
        [
          { wrong: `SELECT * FROM employees WHERE dept_id = 1 OR dept_id = 2 AND salary > 70000;`, correct: `SELECT * FROM employees WHERE (dept_id = 1 OR dept_id = 2) AND salary > 70000;`, explanation: 'AND has higher precedence than OR. Without parentheses, it reads as "dept_id=1 OR (dept_id=2 AND salary>70000)" which includes ALL dept 1 employees regardless of salary.' },
        ],
        { question: 'What does "A AND B OR C" evaluate as?', options: ['(A AND B) OR C', 'A AND (B OR C)', 'A OR B AND C', 'Depends on values'], answer: 0, explanation: 'AND has higher precedence than OR, so AND is evaluated first: (A AND B) OR C. Use parentheses to make your intent clear.' },
        ['AND', 'OR', 'NOT', 'Precedence', 'Parentheses']
      ),
      T('2.3', 'IN Operator', '2', 'The IN operator is a shortcut for multiple OR conditions. Instead of writing WHERE city = \'New York\' OR city = \'Chicago\' OR city = \'Boston\', you can write WHERE city IN (\'New York\', \'Chicago\', \'Boston\'). It\'s cleaner, shorter, and less error-prone.\n\nIN works with any data type — numbers, strings, dates. You can also use NOT IN to exclude values. A common interview pattern is using IN with a subquery: WHERE dept_id IN (SELECT dept_id FROM departments WHERE budget > 200000). This finds employees in departments with large budgets.\n\nBe careful with NULL and NOT IN: if the list contains a NULL, NOT IN returns no rows at all! This is because NULL comparisons return NULL, and NOT IN effectively checks each value with <>, and any NULL in the list makes the entire result unknown.', `┌────────────────────────────────────┐\n│   IN: SHORTCUT FOR MULTIPLE OR     │\n├────────────────────────────────────┤\n│  WHERE city IN ('NY','LA','CHI')   │\n│  = city='NY' OR city='LA' OR ...  │\n│                                    │\n│  WHERE id NOT IN (1,2,3)          │\n│  = id<>1 AND id<>2 AND id<>3     │\n└────────────────────────────────────┘`, [
        { line: "SELECT * FROM employees WHERE city IN ('New York', 'Chicago', 'Boston');", explanation: 'IN matches any value in the list. Equivalent to multiple OR conditions.', result: 'Alice, Charlie, Diana, Eve, Grace, Henry, Ivy' },
        { line: 'SELECT * FROM employees WHERE dept_id NOT IN (1, 2);', explanation: 'NOT IN excludes those values. Everyone not in Engineering or Marketing.', result: 'Eve, Frank, Jack, Grace, Henry' },
      ], `SELECT * FROM employees WHERE city IN ('New York', 'Chicago', 'Boston');\n\nSELECT * FROM employees WHERE dept_id NOT IN (1, 2);`, 'IN Operator', `WHERE column IN (val1, val2, val3)\nWHERE column NOT IN (val1, val2, val3)\n\n-- With subquery\nWHERE column IN (SELECT ...)\n\n-- Works with any type\nWHERE id IN (1, 2, 3)\nWHERE name IN ('Alice', 'Bob')\nWHERE date IN ('2024-01-01', '2024-01-02')`, [{ wrong: "SELECT * FROM employees WHERE city IN 'New York';", correct: "SELECT * FROM employees WHERE city IN ('New York');", explanation: 'IN requires parentheses around the list, even with a single value.' }], { question: 'What is WHERE id NOT IN (1,2,NULL) equivalent to?', options: ['id <> 1 AND id <> 2', 'id <> 1 AND id <> 2 AND id <> NULL', 'Returns no rows (NULL issue)', 'id is not 1 or 2'], answer: 2, explanation: 'NOT IN with NULL in the list returns no rows because id <> NULL is NULL for every row, making the entire AND chain NULL.' }, ['IN', 'NOT IN', 'Subquery IN']),
      T('2.4', 'BETWEEN Operator', '2', 'BETWEEN selects values within a range. It\'s inclusive on both ends — BETWEEN 10 AND 20 includes both 10 and 20. It\'s equivalent to >= AND <=, but more readable. BETWEEN works with numbers, dates, and strings (alphabetical order).\n\nFor dates, BETWEEN is very common: WHERE hire_date BETWEEN \'2020-01-01\' AND \'2022-12-31\' finds employees hired in 2020-2022. Remember that BETWEEN is inclusive, so if your date column has time components, you might miss the last day\'s afternoon records. Use < the next day instead.\n\nNOT BETWEEN excludes the range. You can also use BETWEEN with strings for alphabetical ranges: WHERE name BETWEEN \'A\' AND \'M\' finds names starting with A through M.', `┌────────────────────────────────────┐\n│   BETWEEN: RANGE FILTER            │\n├────────────────────────────────────┤\n│  BETWEEN 10 AND 20                 │\n│  = >= 10 AND <= 20 (inclusive!)    │\n│                                    │\n│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐  │\n│  │5 │10│12│15│18│20│22│25│30│35│  │\n│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘  │\n│     ✓  ✓  ✓  ✓  ✓  ✓             │\n│     ←── BETWEEN 10 AND 20 ──→     │\n└────────────────────────────────────┘`, [
        { line: "SELECT name, salary FROM employees WHERE salary BETWEEN 65000 AND 85000;", explanation: 'Inclusive range: includes 65000 and 85000.', result: 'Bob(85000), Charlie(70000), Diana(72000), Eve(65000), Frank(68000)' },
        { line: "SELECT name, hire_date FROM employees WHERE hire_date BETWEEN '2020-01-01' AND '2022-12-31';", explanation: 'Date range: employees hired between 2020 and 2022 inclusive.', result: 'Alice, Bob, Diana, Eve, Frank, Grace, Ivy' },
      ], `SELECT name, salary FROM employees\nWHERE salary BETWEEN 65000 AND 85000;\n\nSELECT name, hire_date FROM employees\nWHERE hire_date BETWEEN '2020-01-01' AND '2022-12-31';`, 'BETWEEN Syntax', `WHERE column BETWEEN low AND high\nWHERE column NOT BETWEEN low AND high\n\n-- Inclusive on both ends!\nBETWEEN 10 AND 20  → 10,11,...,19,20\n\n-- Equivalent to:\nWHERE column >= low AND column <= high\n\n-- Works with dates\nWHERE date BETWEEN '2024-01-01' AND '2024-12-31'\n\n-- Works with strings (alphabetical)\nWHERE name BETWEEN 'A' AND 'M'`, [{ wrong: "SELECT * FROM employees WHERE salary BETWEEN 85000 AND 65000;", correct: "SELECT * FROM employees WHERE salary BETWEEN 65000 AND 85000;", explanation: 'The lower value must come first. BETWEEN 85000 AND 65000 returns nothing because no value is >= 85000 AND <= 65000.' }], { question: 'Is BETWEEN 10 AND 20 inclusive?', options: ['Only 10', 'Only 20', 'Both 10 and 20', 'Neither'], answer: 2, explanation: 'BETWEEN is inclusive on both ends. BETWEEN 10 AND 20 includes both 10 and 20, as well as all values in between.' }, ['BETWEEN', 'NOT BETWEEN', 'Range', 'Date range']),
      T('2.5', 'LIKE Operator & Wildcards', '2', 'LIKE is SQL\'s pattern matching operator. It uses two wildcards: % matches any sequence of characters (including empty), and _ matches exactly one character. Think of % as "anything here" and _ as "any single character here".\n\nCommon patterns: LIKE \'A%\' finds strings starting with A. LIKE \'%son%\' finds strings containing "son". LIKE \'_o%\' finds strings where the second character is "o". LIKE \'%Y\' finds strings ending with Y.\n\nLIKE is case-sensitive in some databases (PostgreSQL) and case-insensitive in others (MySQL, SQL Server). SQLite is case-insensitive for ASCII letters. Use ILIKE (PostgreSQL) or LOWER(column) LIKE for consistent case-insensitive matching.\n\nIn interviews, LIKE is tested with "find names starting with..." or "find emails containing @gmail.com". NOT LIKE excludes patterns. Regular expressions (REGEXP) provide more powerful pattern matching but are database-specific.', `┌──────────────────────────────────────┐\n│   LIKE: PATTERN MATCHING             │\n├──────────────────────────────────────┤\n│  % = any characters (0 or more)     │\n│  _ = exactly one character          │\n│                                      │\n│  'A%'    → starts with A            │\n│  '%son'  → ends with son            │\n│  '%ing%' → contains ing             │\n│  '_o%'   → 2nd char is o           │\n│  'A___'  → A + exactly 3 chars      │\n└──────────────────────────────────────┘`, [
        { line: "SELECT name FROM employees WHERE name LIKE 'A%';", explanation: '% matches any characters after A. Finds names starting with A.', result: 'Alice' },
        { line: "SELECT name FROM employees WHERE name LIKE '%e%';", explanation: '%e% finds names containing "e" anywhere.', result: 'Alice, Charlie, Eve, Grace, Henry, Ivy' },
        { line: "SELECT name FROM employees WHERE name LIKE '____e';", explanation: 'Four underscores then e. Finds 5-letter names ending in e.', result: 'Alice, Grace' },
      ], `SELECT name FROM employees WHERE name LIKE 'A%';\nSELECT name FROM employees WHERE name LIKE '%e%';\nSELECT name FROM employees WHERE name LIKE '____e';\nSELECT name FROM employees WHERE name NOT LIKE '%a%';`, 'LIKE & Wildcards', `WHERE column LIKE 'pattern'\nWHERE column NOT LIKE 'pattern'\n\n% = zero or more characters\n_ = exactly one character\n\nExamples:\n'A%'     starts with A\n'%s'     ends with s\n'%mid%'  contains 'mid'\n'_o%'    second char is 'o'\n'A___'   A followed by exactly 3 chars\n\n-- Escape literal % or _\nWHERE col LIKE '100\\%' ESCAPE '\\'`, [{ wrong: "SELECT * FROM employees WHERE name LIKE '%Alice';", correct: "SELECT * FROM employees WHERE name = 'Alice';", explanation: 'If you\'re matching an exact value, use = instead of LIKE. LIKE is for patterns. %Alice matches anything ending with Alice.' }], { question: 'What does LIKE \'_o%\' match?', options: ['Contains "o"', 'Starts with "o"', 'Second character is "o"', 'Ends with "o"'], answer: 2, explanation: '_ matches exactly one character, so _o% means "any single character, then o, then anything" — second character is o.' }, ['LIKE', 'NOT LIKE', '%', '_', 'Pattern matching']),
      T('2.6', 'IS NULL / IS NOT NULL', '2', 'We covered NULL basics earlier, but IS NULL/IS NOT NULL deserve their own topic because they\'re so important in real-world queries and interviews. NULL values are everywhere in production databases — optional fields, missing data, outer joins all produce NULLs.\n\nIS NULL checks if a value is missing/unknown. IS NOT NULL checks if a value exists. These are the ONLY correct ways to test for NULL. Using = NULL or <> NULL will not work and is one of the most common SQL mistakes.\n\nIn practice, you often need to handle NULLs in multiple ways: filtering them out (WHERE column IS NOT NULL), replacing them (COALESCE, IFNULL), counting them separately, or using them in conditional logic (CASE WHEN column IS NULL THEN...).\n\nInterview tip: When a question says "employees without a manager" or "products with no category", it\'s asking for NULL checks. Always think about whether NULL values might affect your query results.', `┌──────────────────────────────────┐\n│   IS NULL / IS NOT NULL          │\n├──────────────────────────────────┤\n│  ✓ WHERE city IS NULL            │\n│  ✓ WHERE city IS NOT NULL        │\n│  ✗ WHERE city = NULL             │\n│  ✗ WHERE city <> NULL            │\n│  ✗ WHERE city = NULL (no error!) │\n│                                  │\n│  COUNT(*)     → counts all rows  │\n│  COUNT(city)  → skips NULLs      │\n└──────────────────────────────────┘`, [
        { line: 'SELECT * FROM employees WHERE city IS NULL;', explanation: 'Find employees with no city value.', result: 'Jack' },
        { line: 'SELECT * FROM employees WHERE manager_id IS NULL;', explanation: 'Find top-level employees with no manager.', result: 'Alice (she is the boss)' },
      ], `SELECT * FROM employees WHERE city IS NULL;\nSELECT * FROM employees WHERE manager_id IS NULL;\nSELECT COUNT(*) AS total, COUNT(city) AS with_city FROM employees;`, 'NULL Check Syntax', `WHERE column IS NULL       -- value is missing\nWHERE column IS NOT NULL   -- value exists\n\n-- Count with NULLs\nCOUNT(*)       -- all rows\nCOUNT(column)  -- non-NULL values only\n\n-- Replace NULLs\nCOALESCE(col, default)\nIFNULL(col, default)`, [{ wrong: "SELECT * FROM employees WHERE city = NULL;", correct: "SELECT * FROM employees WHERE city IS NULL;", explanation: '= NULL does not work because NULL is not a value. Use IS NULL.' }], { question: 'What does COUNT(column) vs COUNT(*) do differently?', options: ['Same thing', 'COUNT(column) skips NULLs', 'COUNT(*) skips NULLs', 'COUNT(column) counts all'], answer: 1, explanation: 'COUNT(*) counts all rows. COUNT(column) counts only rows where that column is NOT NULL.' }, ['IS NULL', 'IS NOT NULL', 'COUNT behavior', 'NULL in aggregates']),
      T('2.7', 'Combining Multiple Conditions', '2', 'Real-world queries almost always combine multiple conditions. A banking app doesn\'t just find "transactions over $100" — it finds "transactions over $100 that occurred in the last 30 days on credit card accounts flagged for review." Learning to combine conditions correctly is essential.\n\nThe key principles: use AND when all conditions must be true, OR when any condition is sufficient, and always use parentheses when mixing AND/OR to avoid precedence bugs. Think of it like building a sentence: "I want employees who are (in Engineering OR Marketing) AND earn more than 70000."\n\nYou can chain as many conditions as needed. Complex queries might have 5-10 conditions combined. The trick is to use proper indentation and formatting so the logic is clear. Put each condition on its own line with the logical operator at the start of the line.\n\nIn interviews, the ability to translate a business requirement into correctly combined SQL conditions is a core skill. Practice translating English descriptions into SQL WHERE clauses.', `┌─────────────────────────────────────────┐\n│   COMBINING CONDITIONS                  │\n├─────────────────────────────────────────┤\n│  "Engineers earning over 80k in NYC"    │\n│                                         │\n│  WHERE dept_id = 1                      │\n│    AND salary > 80000                   │\n│    AND city = 'New York'                │\n│                                         │\n│  "(Engineering OR Marketing)            │\n│   earning over 70k"                     │\n│                                         │\n│  WHERE (dept_id = 1 OR dept_id = 2)    │\n│    AND salary > 70000                   │\n└─────────────────────────────────────────┘`, [
        { line: "SELECT * FROM employees WHERE dept_id = 1 AND salary > 85000 AND city = 'New York';", explanation: 'Three conditions with AND. All must be true.', result: 'Alice (95000, dept 1, New York)' },
        { line: "SELECT * FROM employees WHERE (dept_id = 1 OR dept_id = 2) AND salary > 70000;", explanation: 'Parentheses ensure OR is evaluated first, then AND.', result: 'Alice, Bob, Ivy, Diana' },
      ], `SELECT * FROM employees\nWHERE dept_id = 1\n  AND salary > 85000\n  AND city = 'New York';\n\nSELECT * FROM employees\nWHERE (dept_id = 1 OR dept_id = 2)\n  AND salary > 70000;`, 'Combining Conditions', `-- AND: all must be true
WHERE cond1 AND cond2 AND cond3

-- OR: any must be true
WHERE cond1 OR cond2 OR cond3

-- Mixed: use parentheses!
WHERE (A OR B) AND C
WHERE A AND (B OR C)

-- Style tip: one condition per line
WHERE dept_id = 1
  AND salary > 70000
  AND city IS NOT NULL`, [{ wrong: "SELECT * FROM employees WHERE dept_id = 1 OR dept_id = 2 AND salary > 70000;", correct: "SELECT * FROM employees WHERE (dept_id = 1 OR dept_id = 2) AND salary > 70000;", explanation: 'AND binds tighter than OR. Without parentheses, ALL dept 1 employees are included regardless of salary.' }], { question: 'How do you write "A or B, and also C"?', options: ['A OR B AND C', '(A OR B) AND C', 'A AND B OR C', 'A OR (B AND C)'], answer: 1, explanation: 'Parentheses make it clear: first evaluate A OR B, then require C as well.' }, ['AND', 'OR', 'Parentheses', 'Precedence', 'Complex filters']),
      T('2.8', 'CASE WHEN Expression', '2', 'CASE WHEN is SQL\'s version of if-else. It lets you create conditional logic in your queries — categorizing data, computing values based on conditions, or creating custom sort orders. Think of it like a spreadsheet\'s IF function on steroids.\n\nThere are two forms: simple CASE (compare one expression to multiple values) and searched CASE (multiple independent conditions). Searched CASE is more common and flexible. Each WHEN is checked in order, and the first match wins. ELSE provides a default if nothing matches.\n\nCASE WHEN is incredibly versatile. You can use it in SELECT to create new columns, in WHERE for conditional filtering, in ORDER BY for custom sorting, in GROUP BY for conditional aggregation, and in HAVING for conditional group filters. It\'s one of the most powerful SQL constructs.\n\nIn interviews, CASE WHEN appears in questions like "Categorize employees as High/Medium/Low salary" or "Calculate bonus as 10% for Engineering, 5% for others." It\'s also key for pivot-style queries.', `┌──────────────────────────────────────────┐\n│   CASE WHEN: CONDITIONAL LOGIC           │\n├──────────────────────────────────────────┤\n│  CASE                                    │\n│    WHEN salary > 80000 THEN 'High'      │\n│    WHEN salary > 60000 THEN 'Medium'    │\n│    ELSE 'Low'                            │\n│  END AS level                            │\n│                                          │\n│  ┌────────┬────────┬───────┐            │\n│  │ Alice  │ 95000  │ High  │            │\n│  │ Bob    │ 85000  │ High  │            │\n│  │ Eve    │ 65000  │ Medium│            │\n│  │ Jack   │ 55000  │ Low   │            │\n│  └────────┴────────┴───────┘            │\n└──────────────────────────────────────────┘`, [
        { line: `SELECT name, salary,\n  CASE\n    WHEN salary > 80000 THEN 'High'\n    WHEN salary > 60000 THEN 'Medium'\n    ELSE 'Low'\n  END AS level\nFROM employees;`, explanation: 'Create a new column based on conditions. First matching WHEN wins.', result: 'Alice=High, Bob=High, Charlie=Medium, Diana=Medium, Eve=Medium, Frank=Medium, Grace=Medium, Henry=High, Ivy=High, Jack=Low' },
        { line: `SELECT dept_id,\n  SUM(CASE WHEN salary > 70000 THEN 1 ELSE 0 END) AS high_earners,\n  COUNT(*) AS total\nFROM employees GROUP BY dept_id;`, explanation: 'Conditional counting: count only high earners per department.', result: 'Dept 1: 3 high/3 total, Dept 2: 1/2, etc.' },
      ], `SELECT name, salary,\n  CASE\n    WHEN salary > 80000 THEN 'High'\n    WHEN salary > 60000 THEN 'Medium'\n    ELSE 'Low'\n  END AS level\nFROM employees;\n\n-- Conditional aggregation\nSELECT dept_id,\n  SUM(CASE WHEN salary > 70000 THEN 1 ELSE 0 END) AS high_earners\nFROM employees GROUP BY dept_id;`, 'CASE WHEN Syntax', `-- Searched CASE (most common)\nCASE\n  WHEN condition1 THEN result1\n  WHEN condition2 THEN result2\n  ELSE default_result\nEND\n\n-- Simple CASE\nCASE expression\n  WHEN value1 THEN result1\n  WHEN value2 THEN result2\n  ELSE default\nEND\n\n-- In SELECT (new column)\nSELECT CASE WHEN ... END AS label\n\n-- In ORDER BY (custom sort)\nORDER BY CASE WHEN status='Active' THEN 1 ELSE 2 END\n\n-- Conditional aggregation\nSUM(CASE WHEN ... THEN 1 ELSE 0 END)`, [{ wrong: `CASE WHEN salary > 80000 'High' ELSE 'Low'`, correct: `CASE WHEN salary > 80000 THEN 'High' ELSE 'Low' END`, explanation: 'Each WHEN must have THEN, and the entire CASE must end with END. Missing THEN or END causes syntax errors.' }], { question: 'What happens if no WHEN matches and there is no ELSE?', options: ['Error', 'Returns 0', 'Returns NULL', 'Skips the row'], answer: 2, explanation: 'If no WHEN condition is true and there is no ELSE, CASE returns NULL.' }, ['CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'Conditional logic']),
      T('2.9', 'COALESCE & NULLIF', '2', 'COALESCE and NULLIF are specialized NULL-handling functions that every SQL developer must know. COALESCE returns the first non-NULL value from a list, making it perfect for providing defaults. NULLIF returns NULL if two values are equal, which is useful for preventing division by zero.\n\nCOALESCE(col, default) is equivalent to "if col is NULL, use default instead." You can pass multiple values: COALESCE(a, b, c, 0) tries a first, then b, then c, then 0. It\'s more portable than IFNULL or NVL, which are database-specific.\n\nNULLIF(a, b) returns NULL if a = b, otherwise returns a. This is crucial for safe division: salary / NULLIF(team_size, 0) avoids the division-by-zero error because NULLIF turns 0 into NULL, and dividing by NULL gives NULL instead of an error.\n\nIn interviews, COALESCE shows up in "replace NULL with default value" questions, and NULLIF in "calculate average without division by zero" scenarios.', `┌──────────────────────────────────────┐\n│   COALESCE & NULLIF                  │\n├──────────────────────────────────────┤\n│  COALESCE(NULL, NULL, 3) → 3        │\n│  COALESCE(NULL, 'hi', 'bye') → 'hi' │\n│  COALESCE(5, 10) → 5               │\n│                                      │\n│  NULLIF(5, 5) → NULL               │\n│  NULLIF(5, 3) → 5                  │\n│  NULLIF(0, 0) → NULL               │\n│                                      │\n│  salary / NULLIF(count, 0)           │\n│  → safe division!                    │\n└──────────────────────────────────────┘`, [
        { line: "SELECT name, COALESCE(city, 'Remote') AS location FROM employees;", explanation: 'Replace NULL city with "Remote".', result: 'Jack shows "Remote" instead of NULL' },
        { line: 'SELECT name, salary / NULLIF(dept_id, 0) AS ratio FROM employees;', explanation: 'Safe division: if dept_id is 0, NULLIF returns NULL, so division gives NULL instead of error.', result: 'All employees get a ratio or NULL (no errors)' },
      ], `SELECT name, COALESCE(city, 'Remote') AS location\nFROM employees;\n\nSELECT name, salary / NULLIF(dept_id, 0) AS ratio\nFROM employees;`, 'COALESCE & NULLIF', `COALESCE(val1, val2, val3, ..., default)\n-- Returns first non-NULL value\n\nNULLIF(expr1, expr2)\n-- Returns NULL if expr1 = expr2\n-- Otherwise returns expr1\n\n-- Common patterns:\nCOALESCE(phone, email, 'N/A')\nsalary / NULLIF(count, 0)  -- safe division\nCOALESCE(bonus, 0) + salary`, [{ wrong: "SELECT COALESCE() FROM employees;", correct: "SELECT COALESCE(city, 'N/A') FROM employees;", explanation: 'COALESCE requires at least one argument. It needs values to check.' }], { question: 'What does COALESCE(NULL, NULL, 5, 10) return?', options: ['NULL', '5', '10', '0'], answer: 1, explanation: 'COALESCE returns the first non-NULL value. NULL and NULL are skipped, 5 is the first non-NULL value.' }, ['COALESCE', 'NULLIF', 'IFNULL', 'NULL handling', 'Safe division']),
      T('2.10', 'Type Casting (CAST, CONVERT)', '2', 'Type casting converts a value from one data type to another. It\'s essential when you need to perform operations that require specific types — like converting a text number to an actual number for math, or converting a number to text for concatenation.\n\nCAST(expression AS type) is the SQL standard syntax. CONVERT(expression, type) is SQL Server syntax. SQLite supports CAST but has limited type affinity. Common casts: CAST(\'123\' AS INTEGER), CAST(salary AS TEXT), CAST(order_date AS DATE).\n\nImplicit casting (automatic conversion) happens in some databases — like when you compare a number to a string. But relying on implicit casting is dangerous because different databases handle it differently. Always use explicit CAST for predictable behavior.\n\nIn interviews, casting appears when you need to extract a year from a date string, convert a string number to integer for comparison, or format output. It\'s also important for UNION queries where columns must have compatible types.', `┌────────────────────────────────────────┐\n│   TYPE CASTING                         │\n├────────────────────────────────────────┤\n│  CAST('123' AS INTEGER) → 123         │\n│  CAST(95000 AS TEXT) → '95000'        │\n│  CAST('2024-01-15' AS DATE) → date    │\n│                                        │\n│  When you need it:                     │\n│  - String → Number for math            │\n│  - Number → String for concat          │\n│  - String → Date for comparison        │\n└────────────────────────────────────────┘`, [
        { line: "SELECT CAST(salary AS TEXT) || ' dollars' AS salary_text FROM employees LIMIT 3;", explanation: 'Convert number to text, then concatenate.', result: '95000 dollars, 85000 dollars, 70000 dollars' },
        { line: "SELECT name, CAST(hire_date AS TEXT) AS hired FROM employees LIMIT 3;", explanation: 'Convert date to text for display or concatenation.', result: 'Alice: 2020-01-15, Bob: 2020-06-01, Charlie: 2019-03-20' },
      ], `SELECT CAST(salary AS TEXT) || ' dollars' AS salary_text\nFROM employees LIMIT 3;\n\nSELECT name, CAST(hire_date AS TEXT) AS hired\nFROM employees LIMIT 3;\n\n-- SQLite also supports:\nSELECT salary || '' FROM employees; -- implicit cast`, 'CAST Syntax', `CAST(expression AS type)\n\n-- Common casts:\nCAST('123' AS INTEGER)\nCAST(95000 AS TEXT)\nCAST('2024-01-15' AS DATE)\nCAST(3.14 AS INTEGER)  -- → 3 (truncated)\n\n-- Try CAST for troubleshooting type issues\n-- Some DBs also support:\nCONVERT(type, expression)  -- SQL Server\nexpression::type           -- PostgreSQL`, [{ wrong: "SELECT CAST('hello' AS INTEGER);", correct: "SELECT CAST('123' AS INTEGER);", explanation: 'Casting a non-numeric string to INTEGER gives 0 or an error depending on the database. Only cast strings that actually contain numbers.' }], { question: 'What does CAST(3.7 AS INTEGER) return?', options: ['3.7', '4', '3', 'Error'], answer: 2, explanation: 'CAST to INTEGER truncates the decimal part. 3.7 becomes 3, not 4 (no rounding).' }, ['CAST', 'CONVERT', 'Type conversion', 'Implicit casting']),
    ]
  },
];

// Helper functions
export function getTopic(id: string): Topic | undefined {
  for (const phase of phases) {
    const topic = phase.topics.find(t => t.id === id);
    if (topic) return topic;
  }
  return undefined;
}

export function getNextTopic(id: string): string | null {
  for (const phase of phases) {
    for (let i = 0; i < phase.topics.length; i++) {
      if (phase.topics[i].id === id && i < phase.topics.length - 1) {
        return phase.topics[i + 1].id;
      }
    }
  }
  // Try next phase
  for (let p = 0; p < phases.length - 1; p++) {
    if (phases[p].topics.some(t => t.id === id)) {
      return phases[p + 1].topics[0]?.id || null;
    }
  }
  return null;
}

export function getPrevTopic(id: string): string | null {
  for (const phase of phases) {
    for (let i = 0; i < phase.topics.length; i++) {
      if (phase.topics[i].id === id && i > 0) {
        return phase.topics[i - 1].id;
      }
    }
  }
  // Try previous phase
  for (let p = 1; p < phases.length; p++) {
    if (phases[p].topics.some(t => t.id === id)) {
      return phases[p - 1].topics[phases[p - 1].topics.length - 1]?.id || null;
    }
  }
  return null;
}
