import { useStore } from '../contexts/Store';

export function DebugPanel() {
  const { orders, products } = useStore();

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: '#1a1a1a',
      border: '2px solid #4ade80',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
    }}>
      <h3 style={{ color: '#4ade80', marginBottom: '10px' }}>🐛 Debug Panel</h3>
      <div><strong>Orders:</strong> {orders.length}</div>
      <div><strong>Products:</strong> {products.length}</div>
      <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.7 }}>
        {orders.length > 0 && <div>First Order: {orders[0].customerName}</div>}
        {products.length > 0 && <div>First Product: {products[0].name}</div>}
      </div>
    </div>
  );
}
