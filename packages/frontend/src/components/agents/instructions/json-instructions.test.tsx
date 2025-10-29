import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JSONInstructions } from './json-instructions';

describe('JSONInstructions', () => {
  describe('component rendering', () => {
    it('renders instructions with agent name and NATS server', () => {
      render(<JSONInstructions agentName="My Agent" natsServer="localhost:4222" />);

      expect(screen.getByText(/Connect your agent using a JSON configuration file/i)).toBeInTheDocument();
      expect(screen.getByText(/Create your configuration file/i)).toBeInTheDocument();
      expect(screen.getByText(/Configure your agent/i)).toBeInTheDocument();
    });

    it('renders code block with configuration', () => {
      const { container } = render(
        <JSONInstructions agentName="Test Agent" natsServer="nats.example.com:4222" />
      );

      const codeBlock = container.querySelector('pre');
      expect(codeBlock).toBeInTheDocument();
    });

    it('displays RUNTIME_NAME and NATS_SERVERS information', () => {
      render(<JSONInstructions agentName="Test Agent" natsServer="localhost:4222" />);

      expect(screen.getByText('RUNTIME_NAME')).toBeInTheDocument();
      expect(screen.getByText('NATS_SERVERS')).toBeInTheDocument();
    });

    it('renders additional resources section', () => {
      render(<JSONInstructions agentName="Test Agent" natsServer="localhost:4222" />);

      expect(screen.getByText('Additional Resources')).toBeInTheDocument();
      expect(
        screen.getByText(/Ensure your NATS server is accessible from your agent/i)
      ).toBeInTheDocument();
    });
  });

  describe('sanitizeAgentName prop behavior', () => {
    describe('when sanitizeAgentName is true', () => {
      it('uses sanitized agent name as JSON key instead of "filesystem"', () => {
        const { container } = render(
          <JSONInstructions agentName="My Agent" natsServer="localhost:4222" sanitizeAgentName={true} />
        );

        const codeBlock = container.querySelector('pre');
        const codeContent = codeBlock?.textContent || '';

        // Should use "my-agent" as the key
        expect(codeContent).toContain('"my-agent"');
        // Should NOT contain "filesystem"
        expect(codeContent).not.toContain('"filesystem"');
      });

      it('sanitizes agent name: converts to lowercase', () => {
        const { container } = render(
          <JSONInstructions agentName="PRODUCTION" natsServer="localhost:4222" sanitizeAgentName={true} />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';
        expect(codeContent).toContain('"production"');
      });

      it('sanitizes agent name: replaces spaces with hyphens', () => {
        const { container } = render(
          <JSONInstructions agentName="Production Runtime" natsServer="localhost:4222" sanitizeAgentName={true} />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';
        expect(codeContent).toContain('"production-runtime"');
      });

      it('sanitizes agent name: removes special characters', () => {
        const { container } = render(
          <JSONInstructions agentName="Agent #1" natsServer="localhost:4222" sanitizeAgentName={true} />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';
        expect(codeContent).toContain('"agent-1"');
      });

      it('sanitizes agent name: prefixes with underscore if starts with number', () => {
        const { container } = render(
          <JSONInstructions agentName="123 Agent" natsServer="localhost:4222" sanitizeAgentName={true} />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';
        expect(codeContent).toContain('"_123-agent"');
      });

      it('sanitizes agent name: falls back to "agent" for empty/invalid names', () => {
        const { container } = render(
          <JSONInstructions agentName="!!!" natsServer="localhost:4222" sanitizeAgentName={true} />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';
        expect(codeContent).toContain('"agent"');
      });

      it('preserves original agent name in RUNTIME_NAME env variable', () => {
        const { container } = render(
          <JSONInstructions
            agentName="My Special Agent #1"
            natsServer="localhost:4222"
            sanitizeAgentName={true}
          />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';

        // The RUNTIME_NAME should preserve the original name
        expect(codeContent).toContain('"RUNTIME_NAME": "My Special Agent #1"');
        // But the key should be sanitized
        expect(codeContent).toContain('"my-special-agent-1"');
      });
    });

    describe('when sanitizeAgentName is false or not provided (default)', () => {
      it('uses original agent name as JSON key without sanitization', () => {
        const { container } = render(
          <JSONInstructions agentName="My Agent" natsServer="localhost:4222" />
        );

        const codeBlock = container.querySelector('pre');
        const codeContent = codeBlock?.textContent || '';

        // Should use the original name as the key
        expect(codeContent).toContain('"My Agent"');
      });

      it('preserves uppercase in JSON key', () => {
        const { container } = render(
          <JSONInstructions agentName="PRODUCTION" natsServer="localhost:4222" sanitizeAgentName={false} />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';
        expect(codeContent).toContain('"PRODUCTION"');
      });

      it('preserves spaces in JSON key', () => {
        const { container } = render(
          <JSONInstructions agentName="Production Runtime" natsServer="localhost:4222" />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';
        expect(codeContent).toContain('"Production Runtime"');
      });

      it('preserves special characters in JSON key', () => {
        const { container } = render(
          <JSONInstructions agentName="Agent #1" natsServer="localhost:4222" sanitizeAgentName={false} />
        );

        const codeContent = container.querySelector('pre')?.textContent || '';
        expect(codeContent).toContain('"Agent #1"');
      });
    });
  });

  describe('JSON configuration structure', () => {
    it('generates valid JSON configuration', () => {
      const { container } = render(
        <JSONInstructions agentName="Test Agent" natsServer="nats.example.com:4222" />
      );

      const codeContent = container.querySelector('pre')?.textContent || '';

      // Code block includes line numbers, so check for structure elements
      expect(codeContent).toContain('"mcpServers"');
      expect(codeContent).toContain('"Test Agent"');
      expect(codeContent).toContain('"command": "npx"');
      expect(codeContent).toContain('@2ly/runtime');
    });

    it('includes correct environment variables', () => {
      const { container } = render(
        <JSONInstructions agentName="My Agent" natsServer="custom.nats:4222" />
      );

      const codeContent = container.querySelector('pre')?.textContent || '';

      // Check for env variables in the code content
      expect(codeContent).toContain('"RUNTIME_NAME": "My Agent"');
      expect(codeContent).toContain('"NATS_SERVERS": "nats://custom.nats:4222"');
    });

    it('uses default NATS server when not provided', () => {
      const { container } = render(<JSONInstructions agentName="Test" natsServer="" />);

      const codeContent = container.querySelector('pre')?.textContent || '';
      expect(codeContent).toContain('your-nats-server:4222');
    });
  });

  describe('acceptance criteria verification (with sanitization enabled)', () => {
    it('uses dynamic agent name instead of hardcoded "filesystem"', () => {
      const { container } = render(
        <JSONInstructions agentName="MyAgent" natsServer="localhost:4222" sanitizeAgentName={true} />
      );

      const codeContent = container.querySelector('pre')?.textContent || '';
      expect(codeContent).not.toContain('"filesystem"');
      expect(codeContent).toContain('"myagent"');
    });

    it('converts agent name to lowercase', () => {
      const { container } = render(
        <JSONInstructions agentName="PRODUCTION" natsServer="localhost:4222" sanitizeAgentName={true} />
      );

      const codeContent = container.querySelector('pre')?.textContent || '';
      // Check that the JSON key is lowercase
      expect(codeContent).toContain('"production":');
      // The original name is preserved in RUNTIME_NAME, so PRODUCTION will still appear
      expect(codeContent).toContain('"RUNTIME_NAME": "PRODUCTION"');
    });

    it('replaces spaces with hyphens', () => {
      const { container } = render(
        <JSONInstructions agentName="My Agent" natsServer="localhost:4222" sanitizeAgentName={true} />
      );

      const codeContent = container.querySelector('pre')?.textContent || '';
      expect(codeContent).toContain('"my-agent"');
    });

    it('removes special characters from JSON key', () => {
      const { container } = render(
        <JSONInstructions agentName="Agent@#$" natsServer="localhost:4222" sanitizeAgentName={true} />
      );

      const codeContent = container.querySelector('pre')?.textContent || '';
      // The JSON key should only contain "agent"
      expect(codeContent).toContain('"agent":');
      // Original name is preserved in RUNTIME_NAME
      expect(codeContent).toContain('"RUNTIME_NAME": "Agent@#$"');
    });

    it('example: "Production Runtime" generates key "production-runtime"', () => {
      const { container } = render(
        <JSONInstructions agentName="Production Runtime" natsServer="localhost:4222" sanitizeAgentName={true} />
      );

      const codeContent = container.querySelector('pre')?.textContent || '';
      expect(codeContent).toContain('"production-runtime"');
    });

    it('generates valid JSON structure that is ready to copy-paste', () => {
      const { container } = render(
        <JSONInstructions agentName="Test Agent" natsServer="localhost:4222" sanitizeAgentName={true} />
      );

      const codeContent = container.querySelector('pre')?.textContent || '';

      // Check for proper JSON structure elements
      expect(codeContent).toContain('"mcpServers"');
      expect(codeContent).toContain('"test-agent"');
      expect(codeContent).toContain('"command"');
      expect(codeContent).toContain('"args"');
      expect(codeContent).toContain('"env"');
      expect(codeContent).toContain('"RUNTIME_NAME"');
      expect(codeContent).toContain('"NATS_SERVERS"');
    });
  });
});
