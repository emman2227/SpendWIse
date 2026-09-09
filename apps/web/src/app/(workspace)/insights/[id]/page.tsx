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
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
        <Link href="/insights" className="self-start">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <PageHeader
            eyebrow="AI Deep Dive"
            meta={<Badge variant="info">Beta</Badge>}
            title="Insight Analysis"
            description="Ask questions and dive deeper into this specific insight."
          />
        </div>
      </div>

      <SurfaceCard className="rounded-[22px] sm:rounded-[32px] px-4 py-5 sm:px-8 sm:py-8 space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink">{insight.title}</h2>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-ink-soft leading-relaxed">
            {insight.message}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-sage/10 rounded-2xl p-3.5 sm:p-4">
            <p className="text-[11px] sm:text-xs font-semibold text-ink-soft uppercase tracking-wider">
              Reasoning
            </p>
            <p className="mt-1 text-xs sm:text-sm text-ink">{insight.reason}</p>
          </div>
          <div className="bg-sage/10 rounded-2xl p-3.5 sm:p-4">
            <p className="text-[11px] sm:text-xs font-semibold text-ink-soft uppercase tracking-wider">
              Recommendation
            </p>
            <p className="mt-1 text-xs sm:text-sm text-brand font-medium">
              {insight.recommendation}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="rounded-[22px] sm:rounded-[32px] px-0 py-0 overflow-hidden flex flex-col h-[440px] sm:h-[500px]">
        <div className="bg-sage/10 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-brand" />
            <h3 className="text-sm sm:text-base font-semibold text-ink">Ask SpendWise AI</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 text-ink-soft px-4">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-line" />
              <p className="text-xs sm:text-sm">Ask a question to dive deeper into this insight.</p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 ${
                    msg.role === 'user' ? 'bg-ink text-white' : 'bg-sage/10 text-ink'
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
          {deepDiveMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 bg-sage/10 text-ink">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce delay-75" />
                  <div className="h-2 w-2 rounded-full bg-brand animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 bg-paper border-t border-line space-y-2.5 sm:space-y-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleAsk(sq)}
                disabled={deepDiveMutation.isPending}
                className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-sage/10 text-ink-soft hover:bg-sage/20 hover:text-ink transition-colors disabled:opacity-50"
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
              className="flex-1 bg-sage/10 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-base sm:text-sm text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
              disabled={deepDiveMutation.isPending}
            />
            <Button
              onClick={() => handleAsk(question)}
              disabled={!question.trim() || deepDiveMutation.isPending}
              className="rounded-xl px-3.5 sm:px-4 h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
