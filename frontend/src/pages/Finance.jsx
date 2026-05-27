import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Doughnut } from 'react-chartjs-2';
import { Coins, Plus, Trash2, Calendar, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Finance = () => {
  const { authFetch } = useAuth();
  
  // Date state
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [transactions, setTransactions] = useState([]);
  const [date, setDate] = useState(getTodayString());
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const categories = {
    income: ['Salary', 'Side Hustle', 'Investments', 'Other Income'],
    expense: ['Food', 'Rent', 'Utilities', 'Entertainment', 'Books/Education', 'Health/Fitness', 'Transport', 'Shopping', 'Custom Expense']
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/finance');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSubmitting(true);

    try {
      const res = await authFetch('/finance', {
        method: 'POST',
        body: JSON.stringify({
          date,
          type,
          amount: Number(amount),
          category,
          description
        })
      });

      if (res.ok) {
        const newTx = await res.json();
        setTransactions(prev => [newTx, ...prev]);
        setAmount('');
        setDescription('');
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const res = await authFetch(`/finance/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTransactions(prev => prev.filter(tx => tx.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  // Calculations
  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalExpense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Expense breakdown by category
  const expenseCategories = categories.expense;
  const categoryTotals = expenseCategories.map(cat => {
    return transactions
      .filter(tx => tx.type === 'expense' && tx.category === cat)
      .reduce((acc, tx) => acc + tx.amount, 0);
  });

  const hasExpenses = categoryTotals.some(val => val > 0);

  const doughnutData = {
    labels: expenseCategories.filter((_, idx) => categoryTotals[idx] > 0),
    datasets: [
      {
        data: categoryTotals.filter(val => val > 0),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',   // Food
          'rgba(99, 102, 241, 0.6)',  // Rent
          'rgba(245, 158, 11, 0.6)',  // Utilities
          'rgba(168, 85, 247, 0.6)',  // Entertainment
          'rgba(16, 185, 129, 0.6)',  // Books/Education
          'rgba(59, 130, 246, 0.6)',  // Health/Fitness
          'rgba(236, 72, 153, 0.6)',  // Transport
          'rgba(20, 184, 166, 0.6)',  // Shopping
          'rgba(100, 116, 139, 0.6)'  // Custom Expense
        ],
        borderColor: [
          '#ef4444',
          '#6366f1',
          '#f59e0b',
          '#a855f7',
          '#10b981',
          '#3b82f6',
          '#ec4899',
          '#14b8a6',
          '#64748b'
        ],
        borderWidth: 1
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#e2e8f0',
          font: { size: 11, family: 'Outfit, sans-serif' }
        }
      }
    }
  };

  // Adjust categories on type change
  useEffect(() => {
    setCategory(categories[type][0]);
  }, [type]);

  return (
    <div className="page-container" style={{ overflowY: 'auto' }}>
      
      {/* Stat Cards Row */}
      <div className="grid-3" style={{ gap: '20px', marginBottom: '20px', flexShrink: 0 }}>
        
        {/* Total Income Stat */}
        <div className="card stat-widget" style={{ padding: '16px 20px' }}>
          <div className="flex justify-between align-center" style={{ width: '100%' }}>
            <span className="stat-subtitle" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total Income</span>
            <TrendingUp size={16} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '28px', color: 'var(--color-success)', background: 'none', WebkitTextFillColor: 'initial' }}>
            ₹{totalIncome.toLocaleString()}
          </div>
          <span className="stat-subtitle" style={{ fontSize: '11px' }}>Cash Inflow Logged</span>
        </div>

        {/* Total Expenses Stat */}
        <div className="card stat-widget" style={{ padding: '16px 20px' }}>
          <div className="flex justify-between align-center" style={{ width: '100%' }}>
            <span className="stat-subtitle" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Total Expenses</span>
            <TrendingDown size={16} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '28px', color: 'var(--color-danger)', background: 'none', WebkitTextFillColor: 'initial' }}>
            ₹{totalExpense.toLocaleString()}
          </div>
          <span className="stat-subtitle" style={{ fontSize: '11px' }}>Cash Outflow Logged</span>
        </div>

        {/* Net Savings Stat */}
        <div className="card stat-widget" style={{ padding: '16px 20px' }}>
          <div className="flex justify-between align-center" style={{ width: '100%' }}>
            <span className="stat-subtitle" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Net Savings</span>
            <Coins size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '28px', color: netSavings >= 0 ? 'var(--color-primary)' : 'var(--color-danger)', background: 'none', WebkitTextFillColor: 'initial' }}>
            {netSavings < 0 ? '-' : ''}₹{Math.abs(netSavings).toLocaleString()}
          </div>
          <span className="stat-subtitle" style={{ fontSize: '11px', display: 'flex', gap: '8px' }}>
            Savings Rate: <strong style={{ color: savingsRate >= 20 ? 'var(--color-success)' : savingsRate >= 0 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{savingsRate}%</strong>
          </span>
        </div>

      </div>

      {loading ? (
        <div className="card text-center" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Compiling financial logbook...</span>
        </div>
      ) : (
        <div className="grid-dash">
          
          {/* Left Column: Form & History */}
          <div className="inner-column">
            
            {/* Form card */}
            <div className="card">
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '14px' }}>Log New Financial Flow</span>
              
              <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Flow Type</label>
                    <select
                      className="form-input"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="expense">Expense (Outflow)</option>
                      <option value="income">Income (Inflow)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="e.g. 500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories[type].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description / Remarks (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Weekly grocery run, Part-time stipend"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                  <Plus size={14} /> {submitting ? 'Logging Transaction...' : 'Add Transaction Log'}
                </button>
              </form>
            </div>

            {/* History logs card */}
            <div className="card" style={{ flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '12px' }}>Transaction Ledger Log</span>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {transactions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                    No transactions logged yet. Add your income/expenses above to track balances.
                  </p>
                ) : (
                  transactions.map(tx => (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'
                        }} />
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{tx.category}</h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            {tx.description || 'No description'} • {tx.date}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: tx.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                        </span>
                        <button onClick={() => handleDeleteTransaction(tx.id)} className="btn-icon" title="Delete Log" style={{ padding: '4px' }}>
                          <Trash2 size={12} style={{ color: 'var(--color-danger)' }} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Expense Category Chart */}
          <div className="inner-column">
            
            <div className="card" style={{ flex: 1, minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
              <span className="card-title" style={{ fontSize: '13px', marginBottom: '16px' }}>Discretionary Outflow Distribution</span>
              
              <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {!hasExpenses ? (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '0 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Info size={16} />
                      <p>No expenses tracked. Categories breakdown will load dynamically when expense records are added.</p>
                    </div>
                  </div>
                ) : (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Finance;
