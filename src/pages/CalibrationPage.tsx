import { useNavigate } from 'react-router-dom';
import { CalibrationModule } from '../components/calibration/CalibrationModule';

export default function CalibrationPage() {
    const navigate = useNavigate();

    return (
        <CalibrationModule onCalibrationComplete={() => navigate('/dashboard')} />
    );
}
