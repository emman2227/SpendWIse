'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';
import { deepDiveInsight, getInsightDetails } from '@/lib/analytics/client';

export default function InsightDeepDivePage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; content: string }>>(
    [],
  );

  const { data: insight, isLoading } = useQuery({
    queryKey: ['analytics', 'insights', id],
    queryFn: () => getInsightDetails(id),
  });

  const deepDiveMutation = useMutation({
    mutationFn: (q: string) => deepDiveInsight(id, q),
    onSuccess: (data) => {
      setChatHistory((prev) => [...prev, { role: 'ai', content: data.answer }]);
      setSuggestedQuestions(data.suggestedFollowUps);
    },
  });

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    'What specific transactions caused this?',
    'How can I fix this in my budget?',
    'Show me the historical trend for this category',
  ]);

  const handleAsk = (q: string) => {
    if (!q.trim() || deepDiveMutation.isPending) return;

    setChatHistory((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    deepDiveMutation.mutate(q);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-1/3" />
        <Skeleton className="h-[400px] w-full rounded-[32px]" />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-ink-soft">Insight not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/insights">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageHeader
          eyebrow="AI Deep Dive"
          meta={<Badge variant="info">Beta</Badge>}
          title="Insight Analysis"
          description="Ask questions and dive deeper into this specific insight."
        />
      </div>

      <SurfaceCard className="rounded-[32px] px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">{insight.title}</h2>
          <p className="mt-2 text-ink-soft leading-relaxed">{insight.message}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-sage/10 rounded-2xl p-4">
            <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
              Reasoning
            </p>
            <p className="mt-1 text-sm text-ink">{insight.reason}</p>
          </div>
          <div className="bg-sage/10 rounded-2xl p-4">
            <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
              Recommendation
            </p>
            <p className="mt-1 text-sm text-brand font-medium">{insight.recommendation}</p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="rounded-[32px] px-0 py-0 overflow-hidden flex flex-col h-[500px]">
        <div className="bg-sage/10 px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            <h3 className="font-semibold text-ink">Ask SpendWise AI</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-ink-soft">
              <Sparkles className="h-10 w-10 text-line" />
              <p>Ask a question to dive deeper into this insight.</p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user' ? 'bg-ink text-white' : 'bg-sage/10 text-ink'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {deepDiveMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-sage/10 text-ink">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce delay-75" />
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-paper border-t border-line space-y-3">
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleAsk(sq)}
                disabled={deepDiveMutation.isPending}
                className="text-xs px-3 py-1.5 rounded-full bg-sage/10 text-ink-soft hover:bg-sage/20 hover:text-ink transition-colors disabled:opacity-50"
              >
                {sq}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk(question)}
              placeholder="Ask a question about this insight..."
              className="flex-1 bg-sage/10 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              disabled={deepDiveMutation.isPending}
            />
            <Button
              onClick={() => handleAsk(question)}
              disabled={!question.trim() || deepDiveMutation.isPending}
              className="rounded-xl px-4 h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
