import { useNavigate } from 'react-router-dom';
import AddTools from '../components/add-agent-workflow/AddTools';
import CloseIcon from '../components/ui/CloseIcon';

function MCPServerWorkflowPage() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen bg-gray-50">
            <div className="absolute right-4 top-4 z-10">
                <CloseIcon ariaLabel="Cancel" onClick={() => navigate('/mcp-servers')} />
            </div>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl">
                    <AddTools onCanProceedChange={() => { }} onSuccessExit={() => navigate('/mcp-servers')} />
                </div>
            </div>
        </div>
    );
}

export default MCPServerWorkflowPage;


