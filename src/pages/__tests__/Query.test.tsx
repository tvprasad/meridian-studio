import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { Query } from '../Query';

import healthFixture from '../../__fixtures__/health.json';
import queryOk from '../../__fixtures__/query-ok.json';
import queryRefused from '../../__fixtures__/query-refused.json';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = () => {};

// ── MSW server ──────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('http://localhost:8000/health', () => {
    return HttpResponse.json(healthFixture);
  }),
  http.get('/example-questions.json', () => {
    return new HttpResponse(null, { status: 404 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderQuery() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Query />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function submitQuery(user: ReturnType<typeof userEvent.setup>, question: string) {
  const textarea = screen.getByRole('textbox');
  await user.type(textarea, question);
  await user.click(screen.getByRole('button', { name: /Send/ }));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Query page — empty state', () => {
  it('shows example question chips on initial load', async () => {
    renderQuery();

    await waitFor(() => {
      expect(screen.getByText('Ask anything about your documents')).toBeInTheDocument();
    });

    // Should show backend-provided suggested questions from health fixture
    expect(screen.getByText('What topics are covered in the knowledge base?')).toBeInTheDocument();
    expect(screen.getByText('How do I rollback a deployment?')).toBeInTheDocument();
  });

  it('populates input when an example question chip is clicked', async () => {
    const user = userEvent.setup();
    renderQuery();

    await waitFor(() => {
      expect(screen.getByText('How do I rollback a deployment?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('How do I rollback a deployment?'));

    expect(screen.getByRole('textbox')).toHaveValue('How do I rollback a deployment?');
  });
});

describe('Query page — OK response', () => {
  it('shows the answer and follow-up prompts after a successful query', async () => {
    server.use(
      http.post('http://localhost:8000/query', () => {
        return HttpResponse.json(queryOk);
      }),
    );

    const user = userEvent.setup();
    renderQuery();

    await submitQuery(user, 'How do I rollback a deployment?');

    // Wait for assistant response
    await waitFor(() => {
      expect(screen.getByText('Meridian is a RAG-powered knowledge engine.')).toBeInTheDocument();
    });

    // Should show follow-up prompts
    expect(screen.getByText('Keep the conversation going:')).toBeInTheDocument();
    expect(screen.getByText('Tell me more about this')).toBeInTheDocument();
    expect(screen.getByText('Can you give me an example?')).toBeInTheDocument();
    expect(screen.getByText('What are the key takeaways?')).toBeInTheDocument();
    expect(screen.getByText('How does this compare to alternatives?')).toBeInTheDocument();

    // Should show confidence pill
    expect(screen.getByText('87.0% confidence')).toBeInTheDocument();
  });

  it('populates input when a follow-up prompt chip is clicked', async () => {
    server.use(
      http.post('http://localhost:8000/query', () => {
        return HttpResponse.json(queryOk);
      }),
    );

    const user = userEvent.setup();
    renderQuery();

    await submitQuery(user, 'What is Meridian?');

    await waitFor(() => {
      expect(screen.getByText('Tell me more about this')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Tell me more about this'));

    expect(screen.getByRole('textbox')).toHaveValue('Tell me more about this');
  });
});

describe('Query page — REFUSED response', () => {
  it('shows refusal reason, confidence explanation, and suggestion chips', async () => {
    server.use(
      http.post('http://localhost:8000/query', () => {
        return HttpResponse.json(queryRefused, { status: 422 });
      }),
    );

    const user = userEvent.setup();
    renderQuery();

    await submitQuery(user, 'Tell me about quantum physics');

    // Wait for refused response
    await waitFor(() => {
      expect(screen.getByText('Could not answer')).toBeInTheDocument();
    });

    // Should show refusal reason
    expect(screen.getByText('Retrieval confidence below threshold')).toBeInTheDocument();

    // Should explain why (confidence vs threshold)
    expect(screen.getByText(/Confidence was 51.4%/)).toBeInTheDocument();
    expect(screen.getByText(/minimum threshold is 60%/)).toBeInTheDocument();

    // Should show suggestion chips (not follow-up prompts)
    expect(screen.getByText('Try one of these instead:')).toBeInTheDocument();
    expect(screen.queryByText('Keep the conversation going:')).not.toBeInTheDocument();

    // Should show confidence pill
    expect(screen.getByText('51.4% confidence')).toBeInTheDocument();
  });

  it('populates input when a suggestion chip is clicked after refusal', async () => {
    server.use(
      http.post('http://localhost:8000/query', () => {
        return HttpResponse.json(queryRefused, { status: 422 });
      }),
    );

    const user = userEvent.setup();
    renderQuery();

    await submitQuery(user, 'Unknown topic');

    await waitFor(() => {
      expect(screen.getByText('Try one of these instead:')).toBeInTheDocument();
    });

    // Find the suggestion section and click a chip within it
    const suggestionSection = screen.getByText('Try one of these instead:').closest('div')!.parentElement!;
    const chip = within(suggestionSection).getByText('How do I rollback a deployment?');
    await user.click(chip);

    expect(screen.getByRole('textbox')).toHaveValue('How do I rollback a deployment?');
  });

  it('does not show follow-up prompts on a REFUSED response', async () => {
    server.use(
      http.post('http://localhost:8000/query', () => {
        return HttpResponse.json(queryRefused, { status: 422 });
      }),
    );

    const user = userEvent.setup();
    renderQuery();

    await submitQuery(user, 'Something random');

    await waitFor(() => {
      expect(screen.getByText('Could not answer')).toBeInTheDocument();
    });

    // Follow-up prompts should NOT appear on refused responses
    expect(screen.queryByText('Keep the conversation going:')).not.toBeInTheDocument();
    expect(screen.queryByText('Tell me more about this')).not.toBeInTheDocument();
  });
});
