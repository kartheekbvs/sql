export const TUTORIAL_SCHEMA = `
CREATE TABLE departments (
  dept_id INTEGER PRIMARY KEY,
  dept_name TEXT NOT NULL,
  location TEXT,
  budget INTEGER
);

INSERT INTO departments VALUES (1, 'Engineering', 'Building A', 500000);
INSERT INTO departments VALUES (2, 'Marketing', 'Building B', 200000);
INSERT INTO departments VALUES (3, 'Sales', 'Building C', 300000);
INSERT INTO departments VALUES (4, 'HR', 'Building A', 150000);
INSERT INTO departments VALUES (5, 'Finance', 'Building D', 250000);

CREATE TABLE employees (
  emp_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  dept_id INTEGER,
  salary INTEGER,
  hire_date TEXT,
  manager_id INTEGER,
  city TEXT
);

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

CREATE TABLE projects (
  project_id INTEGER PRIMARY KEY,
  project_name TEXT NOT NULL,
  dept_id INTEGER,
  start_date TEXT,
  end_date TEXT,
  status TEXT,
  budget INTEGER
);

INSERT INTO projects VALUES (1, 'Alpha', 1, '2023-01-01', '2023-06-30', 'Completed', 100000);
INSERT INTO projects VALUES (2, 'Beta', 1, '2023-03-15', '2023-12-31', 'Active', 150000);
INSERT INTO projects VALUES (3, 'Gamma', 2, '2023-02-01', '2023-08-30', 'Completed', 80000);
INSERT INTO projects VALUES (4, 'Delta', 3, '2023-06-01', '2024-01-31', 'Active', 120000);
INSERT INTO projects VALUES (5, 'Epsilon', 5, '2023-04-01', '2023-09-30', 'Completed', 90000);

CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  city TEXT,
  country TEXT,
  join_date TEXT
);

INSERT INTO customers VALUES (1, 'John Smith', 'john@email.com', 'New York', 'USA', '2022-01-15');
INSERT INTO customers VALUES (2, 'Jane Doe', 'jane@email.com', 'London', 'UK', '2022-03-20');
INSERT INTO customers VALUES (3, 'Mike Johnson', 'mike@email.com', 'Toronto', 'Canada', '2022-05-10');
INSERT INTO customers VALUES (4, 'Sarah Lee', 'sarah@email.com', 'Sydney', 'Australia', '2022-07-01');
INSERT INTO customers VALUES (5, 'David Chen', 'david@email.com', 'Tokyo', 'Japan', '2022-09-15');
INSERT INTO customers VALUES (6, 'Emma Wilson', 'emma@email.com', 'Berlin', 'Germany', '2023-01-10');
INSERT INTO customers VALUES (7, 'James Brown', 'james@email.com', 'Paris', 'France', '2023-03-25');

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock INTEGER,
  supplier TEXT
);

INSERT INTO products VALUES (1, 'Laptop', 'Electronics', 999.99, 50, 'TechCorp');
INSERT INTO products VALUES (2, 'Phone', 'Electronics', 699.99, 100, 'TechCorp');
INSERT INTO products VALUES (3, 'Desk', 'Furniture', 299.99, 30, 'FurniCo');
INSERT INTO products VALUES (4, 'Chair', 'Furniture', 199.99, 60, 'FurniCo');
INSERT INTO products VALUES (5, 'Book', 'Education', 29.99, 200, 'PubHouse');
INSERT INTO products VALUES (6, 'Pen', 'Education', 4.99, 500, 'SupplyCo');
INSERT INTO products VALUES (7, 'Monitor', 'Electronics', 399.99, 40, 'TechCorp');
INSERT INTO products VALUES (8, 'Headphones', 'Electronics', 149.99, 80, 'AudioInc');

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  order_date TEXT,
  amount REAL
);

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
INSERT INTO orders VALUES (11, 1, 8, 1, '2023-11-20', 149.99);
INSERT INTO orders VALUES (12, 3, 5, 3, '2023-12-05', 89.97);

CREATE TABLE students (
  student_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER,
  subject TEXT,
  marks INTEGER,
  pass_year INTEGER
);

INSERT INTO students VALUES (1, 'Amit', 10, 'Math', 85, 2023);
INSERT INTO students VALUES (2, 'Amit', 10, 'Science', 92, 2023);
INSERT INTO students VALUES (3, 'Priya', 10, 'Math', 78, 2023);
INSERT INTO students VALUES (4, 'Priya', 10, 'Science', 88, 2023);
INSERT INTO students VALUES (5, 'Rahul', 11, 'Math', 95, 2023);
INSERT INTO students VALUES (6, 'Rahul', 11, 'Science', 72, 2023);
INSERT INTO students VALUES (7, 'Sneha', 11, 'Math', 63, 2023);
INSERT INTO students VALUES (8, 'Sneha', 11, 'Science', 91, 2023);
INSERT INTO students VALUES (9, 'Vikram', 12, 'Math', 70, 2023);
INSERT INTO students VALUES (10, 'Vikram', 12, 'Science', 65, 2023);

CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  instructor TEXT,
  credits INTEGER,
  dept_id INTEGER
);

INSERT INTO courses VALUES (1, 'Database Systems', 'Dr. Smith', 4, 1);
INSERT INTO courses VALUES (2, 'Web Development', 'Prof. Johnson', 3, 1);
INSERT INTO courses VALUES (3, 'Marketing 101', 'Dr. Williams', 3, 2);
INSERT INTO courses VALUES (4, 'Sales Strategy', 'Prof. Brown', 2, 3);
INSERT INTO courses VALUES (5, 'Financial Accounting', 'Dr. Davis', 4, 5);
INSERT INTO courses VALUES (6, 'Machine Learning', 'Dr. Smith', 4, 1);
`;

// Schema for practice problems - extended version
export const PRACTICE_SCHEMA = TUTORIAL_SCHEMA + `
CREATE TABLE salaries (
  emp_id INTEGER,
  salary INTEGER,
  month TEXT,
  year INTEGER
);

INSERT INTO salaries VALUES (1, 95000, 'January', 2023);
INSERT INTO salaries VALUES (1, 95000, 'February', 2023);
INSERT INTO salaries VALUES (2, 85000, 'January', 2023);
INSERT INTO salaries VALUES (2, 85000, 'February', 2023);
INSERT INTO salaries VALUES (3, 70000, 'January', 2023);
INSERT INTO salaries VALUES (3, 70000, 'February', 2023);

CREATE TABLE movie_ratings (
  movie_id INTEGER PRIMARY KEY,
  title TEXT,
  genre TEXT,
  rating REAL,
  votes INTEGER,
  year INTEGER
);

INSERT INTO movie_ratings VALUES (1, 'The Shawshank Redemption', 'Drama', 9.3, 2500000, 1994);
INSERT INTO movie_ratings VALUES (2, 'The Dark Knight', 'Action', 9.0, 2600000, 2008);
INSERT INTO movie_ratings VALUES (3, 'Inception', 'Sci-Fi', 8.8, 2300000, 2010);
INSERT INTO movie_ratings VALUES (4, 'Interstellar', 'Sci-Fi', 8.7, 1800000, 2014);
INSERT INTO movie_ratings VALUES (5, 'The Godfather', 'Drama', 9.2, 1800000, 1972);
INSERT INTO movie_ratings VALUES (6, 'Pulp Fiction', 'Crime', 8.9, 2000000, 1994);
INSERT INTO movie_ratings VALUES (7, 'Fight Club', 'Drama', 8.8, 2100000, 1999);
INSERT INTO movie_ratings VALUES (8, 'Forrest Gump', 'Drama', 8.8, 2100000, 1994);

CREATE TABLE flights (
  flight_id INTEGER PRIMARY KEY,
  airline TEXT,
  origin TEXT,
  destination TEXT,
  departure TEXT,
  arrival TEXT,
  price REAL,
  seats_available INTEGER
);

INSERT INTO flights VALUES (1, 'Delta', 'New York', 'London', '2024-01-15 08:00', '2024-01-15 20:00', 450.00, 120);
INSERT INTO flights VALUES (2, 'British Airways', 'London', 'Paris', '2024-01-16 09:00', '2024-01-16 11:00', 180.00, 85);
INSERT INTO flights VALUES (3, 'Emirates', 'Dubai', 'Tokyo', '2024-01-17 22:00', '2024-01-18 14:00', 650.00, 200);
INSERT INTO flights VALUES (4, 'Lufthansa', 'Berlin', 'New York', '2024-01-18 07:00', '2024-01-18 16:00', 520.00, 95);
INSERT INTO flights VALUES (5, 'Singapore Air', 'Tokyo', 'Sydney', '2024-01-19 23:00', '2024-01-20 10:00', 380.00, 150);
`;
