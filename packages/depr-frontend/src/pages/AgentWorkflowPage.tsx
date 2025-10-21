import { useNavigate, useLocation } from 'react-router-dom';
import { AddAgentWorkflow } from '../components/add-agent-workflow';

interface AgentWorkflowPageState {
    hideCancel?: boolean;
}

function AgentWorkflowPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state as AgentWorkflowPageState) || {};
    void state;

    const handleComplete = () => {
        navigate('/agents');
    };

    return (
        <div className="relative h-screen bg-gray-50">
            <AddAgentWorkflow onComplete={handleComplete} />
        </div>
    );
}

export default AgentWorkflowPage;


