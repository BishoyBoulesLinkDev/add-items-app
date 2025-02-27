import { Button } from 'antd';
import './App.css';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Button type="primary" className="m-2 p-18" onClick={() => alert('Hello, Ant Design!')}>
        Hello, Ant Design!
      </Button>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Tailwind CSS
      </button>
    </div>
  );
}

export default App;
