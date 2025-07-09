const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Ganesh14',
  database: process.env.DB_NAME || 'boutique_elegance_admin',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Check if tables exist, if not create them
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = '${dbConfig.database}'
    `);
    
    if (tables.length === 0) {
      console.log('📊 Initializing database tables...');
      
      // Create tables (you can import the schema.sql file here)
      // For now, we'll just log that tables should be created
      console.log('⚠️  Please run the schema.sql file to create database tables');
    } else {
      console.log(`✅ Database initialized with ${tables.length} tables`);
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

// Note: Make sure your products table has 'product_type' (VARCHAR) and 'details' (JSON) columns to support dynamic product types.

module.exports = {
  pool,
  testConnection,
  initializeDatabase
}; 
