import './App.css';
import { ConfigProvider } from 'antd';
import { HospitalLists } from './components/Lists';
import data from './data/database.json';

function App() {
  return (
    <div className="app p-4">
      <ConfigProvider direction="rtl">
        <HospitalLists data={data.cities} />
      </ConfigProvider>
    </div>
  );
}

export default App;
