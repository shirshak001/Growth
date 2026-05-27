import { db } from '../config/db.js';

// @desc    Get all transactions for user
// @route   GET /api/finance
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const transactions = db.find('transactions', t => t.userId === userId);
    
    // Sort transactions by date descending, then by createdAt descending
    transactions.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error retrieving transactions' });
  }
};

// @desc    Add a new transaction (income/expense)
// @route   POST /api/finance
// @access  Private
export const addTransaction = async (req, res) => {
  try {
    const { date, type, amount, category, description } = req.body;
    const userId = req.userId;

    if (!date || !type || !amount || !category) {
      return res.status(400).json({ message: 'Missing required transaction fields' });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ message: 'Transaction type must be income or expense' });
    }

    const transaction = db.insert('transactions', {
      userId,
      date,
      type,
      amount: Number(amount),
      category,
      description: description || '',
      createdAt: new Date().toISOString()
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/finance/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const transaction = db.findOne('transactions', t => t.id === id && t.userId === userId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    db.delete('transactions', t => t.id === id);

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};
