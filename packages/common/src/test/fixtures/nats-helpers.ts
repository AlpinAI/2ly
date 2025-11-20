import { connect, NatsConnection } from '@nats-io/transport-node';
import { v4 as uuidv4 } from 'uuid';
import { dgraphQL } from './dgraph-client';
import { HandshakeRequest, HandshakeResponse, NatsMessage } from '@2ly/common/test/test.containers';

let natsConnection: NatsConnection | null = null;

/**
 * Get or create a raw NATS connection for testing
 * Uses raw NATS SDK to avoid decorator parsing issues in Playwright
 */
async function getNatsConnection(): Promise<NatsConnection> {
  if (!natsConnection) {
    const natsUrl = process.env.TEST_NATS_CLIENT_URL || 'nats://localhost:4222';
    natsConnection = await connect({
      servers: natsUrl,
      name: 'playwright-e2e-client',
    });
  }
  return natsConnection;
}

/**
 * Close the NATS connection
 */
export async function closeNatsConnection(): Promise<void> {
  if (natsConnection) {
    await natsConnection.close();
    natsConnection = null;
  }
}

/**
 * Send a toolset handshake message to trigger onboarding step 3 completion
 * Uses HandshakeRequest class for validation but raw NATS for transport
 */
export async function sendToolsetHandshake(params: {
  toolsetKey: string;
  toolsetName: string;
}): Promise<{ workspaceId: string; nature: string; id: string; name: string }> {
  const nc = await getNatsConnection();

  // Use production HandshakeRequest class for proper validation and message construction
  const handshakeRequest = new HandshakeRequest({
    key: params.toolsetKey,
    nature: 'toolset',
    name: params.toolsetName,
    pid: uuidv4(),
    hostIP: '127.0.0.1',
    hostname: 'playwright-test-host',
  });

  // Prepare the message for transmission
  const messageData = handshakeRequest.prepareData();

  // Send raw NATS request-reply
  const responseMsg = await nc.request(handshakeRequest.getSubject(), JSON.stringify(messageData), {
    timeout: 5000,
  });

  // Parse response using NatsMessage registry
  const parsedResponse = NatsMessage.get(responseMsg);

  if (!(parsedResponse instanceof HandshakeResponse)) {
    throw new Error(`Unexpected response type: ${parsedResponse.type}`);
  }

  return parsedResponse.data;
}

/**
 * Poll for onboarding step completion with timeout using direct Dgraph queries
 */
export async function waitForOnboardingStepComplete(
  workspaceId: string,
  stepId: string,
  timeoutMs = 10000,
  pollIntervalMs = 200,
): Promise<void> {
  const query = `
    query GetWorkspace($workspaceId: ID!) {
      getWorkspace(id: $workspaceId) {
        id
        onboardingSteps {
          id
          stepId
          status
        }
      }
    }
  `;

  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < timeoutMs) {
    attempts++;
    const result = await dgraphQL<{
      getWorkspace: {
        id: string;
        onboardingSteps: Array<{ id: string; stepId: string; status: string }>;
      };
    }>(query, { workspaceId });
    const step = result.getWorkspace?.onboardingSteps?.find(s => s.stepId === stepId);

    if (step?.status === 'COMPLETED') {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Onboarding step ${stepId} did not complete within ${timeoutMs}ms after ${attempts} attempts`);
}
