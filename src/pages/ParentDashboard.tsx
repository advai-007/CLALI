import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ParentDashboard = () => {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Parent Dashboard</h1>
            <p className="mb-4">This is a placeholder for the parent dashboard.</p>
            <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
                Logout
            </button>
        </div>
    );
};

export default ParentDashboard;
