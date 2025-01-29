'use client';

import { useEffect, useState, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import * as d3 from 'd3';
import cloud from 'd3-cloud';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'] });

type VisualizationType = 'wordCloud' | 'satisfaction';

type D3Selection = d3.Selection<SVGSVGElement | null, unknown, null, undefined>;

interface Word {
  text: string;
  value: number;
  size?: number;
  x?: number;
  y?: number;
  rotate?: number;
  font?: string;
  style?: string;
  weight?: string | number;
  padding?: number;
}

interface SatisfactionData {
  date: Date;
  satisfaction: number;
  ticketId: string;
}

export default function CardAnalyticsIssues() {
  const [visualizationType, setVisualizationType] = useState<VisualizationType>('wordCloud');
  const [words, setWords] = useState<Word[]>([]);
  const [satisfactionData, setSatisfactionData] = useState<SatisfactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function analyzeTickets() {
      if (!supabase) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select(`
            id,
            title,
            description,
            messages (
              content,
              sender_id
            )
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (ticketsError) throw ticketsError;

        const ticketsWithMessages = tickets.map(ticket => ({
          title: ticket.title,
          description: ticket.description + '\n' + ticket.messages
            .filter((m: any) => m.sender_id !== '00000000-0000-0000-0000-000000000000')
            .map((m: any) => m.content)
            .join('\n')
        }));

        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'analyzeTicketPatterns',
            tickets: ticketsWithMessages,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze tickets');
        }

        const { patterns } = await response.json();
        
        if (Array.isArray(patterns) && patterns.every(p => p.text && typeof p.value === 'number')) {
          setWords(patterns);
        } else {
          throw new Error('Invalid pattern data received');
        }

      } catch (err) {
        setError('Failed to analyze tickets');
      } finally {
        setIsLoading(false);
      }
    }

    analyzeTickets();
  }, [supabase]);

  useEffect(() => {
    if (visualizationType === 'satisfaction') {
      async function fetchSatisfactionData() {
        if (!supabase) return;
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('tickets')
            .select('id, created_at, status')
            .order('created_at', { ascending: true });

          if (error) throw error;

          // Generate sample satisfaction data
          const sampleData = data.map(ticket => ({
            date: new Date(ticket.created_at),
            satisfaction: Math.random() * 2 + 3, // Random score between 3-5
            ticketId: ticket.id
          }));

          setSatisfactionData(sampleData);
        } catch (err) {
          setError('Failed to load satisfaction data');
        } finally {
          setIsLoading(false);
        }
      }

      fetchSatisfactionData();
    }
  }, [visualizationType, supabase]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    if (visualizationType === 'wordCloud' && words.length > 0) {
      const layout = cloud()
        .size([width * 0.8, height * 0.8])
        .padding(20)
        .rotate(() => 0)
        .spiral('rectangular')
        .font(montserrat.style.fontFamily)
        .fontSize(function(d) { 
          const size = Math.pow((d as any).value || 0, 0.5) * 24 + 12;
          return Math.min(size, 60);
        })
        .words(words.map(d => ({ ...d, size: d.value })));

      layout.on('end', (words: Word[]) => {
        const g = svg.append('g')
          .attr('transform', `translate(${width/2},${height/2})`);

        g.selectAll('text')
          .data(words)
          .enter().append('text')
          .style('font-family', montserrat.style.fontFamily)
          .attr('data-original-color', (_: Word, i: number) => 
            d3.interpolateOranges(i / words.length)
          )
          .style('fill', function(this: SVGTextElement) { 
            return d3.select(this).attr('data-original-color'); 
          })
          .style('font-weight', (d: Word) => d.value > 5 ? '700' : '500')
          .attr('text-anchor', 'middle')
          .attr('transform', (d: Word) => `translate(${d.x},${d.y}) rotate(${d.rotate || 0})`)
          .text((d: Word) => d.text)
          .style('font-size', (d: Word) => `${d.size}px`)
          .style('cursor', 'pointer')
          .on('mouseover', function(this: SVGTextElement) {
            d3.select(this)
              .transition()
              .duration(200)
              .style('fill', '#F6AD55');
          })
          .on('mouseout', function(this: SVGTextElement) {
            d3.select(this)
              .transition()
              .duration(200)
              .style('fill', d3.select(this).attr('data-original-color'));
          });
      });

      layout.start();
    } else if (visualizationType === 'satisfaction' && satisfactionData.length > 0) {
      const margin = { top: 40, right: 40, bottom: 40, left: 40 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g')
        .attr('transform', `translate(${width/2},${height/2})`);

      // Calculate metrics
      const avgSatisfaction = d3.mean(satisfactionData, d => d.satisfaction) || 0;
      const total = satisfactionData.length;
      const detractors = satisfactionData.filter(d => d.satisfaction <= 2).length;
      const neutral = satisfactionData.filter(d => d.satisfaction > 2 && d.satisfaction < 4).length;
      const promoters = satisfactionData.filter(d => d.satisfaction >= 4).length;

      // Center group for star rating
      const centerGroup = g.append('g')
        .attr('transform', 'translate(0,-100)');

      // Add average rating text
      centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-20')
        .style('fill', '#FFFFFF')
        .style('font-size', '48px')
        .style('font-weight', 'bold')
        .text(avgSatisfaction.toFixed(1));

      centerGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '20')
        .style('fill', '#9CA3AF')
        .style('font-size', '18px')
        .text('out of 5');

      // Add stars
      const starGroup = centerGroup.append('g')
        .attr('transform', 'translate(0,60)');

      const starSpacing = 40;
      const startX = -starSpacing * 2;
      
      for (let i = 0; i < 5; i++) {
        const fillAmount = Math.max(0, Math.min(1, avgSatisfaction - i));
        
        // Star background (empty)
        starGroup.append('text')
          .attr('x', startX + (i * starSpacing))
          .attr('text-anchor', 'middle')
          .style('fill', '#4B5563')
          .style('font-size', '32px')
          .text('★');
        
        // Star fill (if partial or full)
        if (fillAmount > 0) {
          starGroup.append('text')
            .attr('x', startX + (i * starSpacing))
            .attr('text-anchor', 'middle')
            .style('fill', '#F59E0B')
            .style('font-size', '32px')
            .text('★');
        }
      }

      // Add breakdown bars
      const breakdownGroup = g.append('g')
        .attr('transform', 'translate(-150,50)');

      const barHeight = 40;
      const barWidth = 300;
      const barSpacing = 20;

      // Detractors
      breakdownGroup.append('rect')
        .attr('y', 0)
        .attr('width', barWidth * (detractors / total))
        .attr('height', barHeight)
        .attr('rx', 4)
        .style('fill', '#EF4444');

      breakdownGroup.append('text')
        .attr('x', -30)
        .attr('y', barHeight / 2)
        .attr('dy', '0.35em')
        .style('fill', '#FFFFFF')
        .style('font-size', '24px')
        .text('😠');

      breakdownGroup.append('text')
        .attr('x', barWidth + 10)
        .attr('y', barHeight / 2)
        .attr('dy', '0.35em')
        .style('fill', '#FFFFFF')
        .text(`${Math.round(detractors / total * 100)}%`);

      // Neutral
      breakdownGroup.append('rect')
        .attr('y', barHeight + barSpacing)
        .attr('width', barWidth * (neutral / total))
        .attr('height', barHeight)
        .attr('rx', 4)
        .style('fill', '#F59E0B');

      breakdownGroup.append('text')
        .attr('x', -30)
        .attr('y', barHeight + barSpacing + barHeight / 2)
        .attr('dy', '0.35em')
        .style('fill', '#FFFFFF')
        .style('font-size', '24px')
        .text('😐');

      breakdownGroup.append('text')
        .attr('x', barWidth + 10)
        .attr('y', barHeight + barSpacing + barHeight / 2)
        .attr('dy', '0.35em')
        .style('fill', '#FFFFFF')
        .text(`${Math.round(neutral / total * 100)}%`);

      // Promoters
      breakdownGroup.append('rect')
        .attr('y', (barHeight + barSpacing) * 2)
        .attr('width', barWidth * (promoters / total))
        .attr('height', barHeight)
        .attr('rx', 4)
        .style('fill', '#10B981');

      breakdownGroup.append('text')
        .attr('x', -30)
        .attr('y', (barHeight + barSpacing) * 2 + barHeight / 2)
        .attr('dy', '0.35em')
        .style('fill', '#FFFFFF')
        .style('font-size', '24px')
        .text('😊');

      breakdownGroup.append('text')
        .attr('x', barWidth + 10)
        .attr('y', (barHeight + barSpacing) * 2 + barHeight / 2)
        .attr('dy', '0.35em')
        .style('fill', '#FFFFFF')
        .text(`${Math.round(promoters / total * 100)}%`);
    }
  }, [words, satisfactionData, visualizationType]);

  const cardClasses = "card bg-gray-800/50 shadow-xl"; // Semi-transparent dark background

  if (isLoading) {
    return (
      <div className={cardClasses}>
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="card-title text-xl font-semibold text-gray-100">Analytics Insights</h2>
              <p className="text-sm text-gray-400 mt-1">Analyzing support data patterns</p>
            </div>
            <select 
              className="select select-bordered bg-gray-700 text-gray-100 border-gray-600"
              value={visualizationType}
              onChange={(e) => setVisualizationType(e.target.value as VisualizationType)}
              disabled
            >
              <option value="wordCloud">Common Issues</option>
              <option value="satisfaction">Customer Satisfaction</option>
            </select>
          </div>
          <div className="flex items-center justify-center h-[400px]">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cardClasses}>
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="card-title text-xl font-semibold text-gray-100">Analytics Insights</h2>
              <p className="text-sm text-gray-400 mt-1">Analyzing support data patterns</p>
            </div>
            <select 
              className="select select-bordered bg-gray-700 text-gray-100 border-gray-600"
              value={visualizationType}
              onChange={(e) => setVisualizationType(e.target.value as VisualizationType)}
              disabled
            >
              <option value="wordCloud">Common Issues</option>
              <option value="satisfaction">Customer Satisfaction</option>
            </select>
          </div>
          <div className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${cardClasses} ${montserrat.className}`}>
      <div className="card-body">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="card-title text-xl font-semibold text-gray-100">Analytics Insights</h2>
            <p className="text-sm text-gray-400 mt-1">
              {visualizationType === 'wordCloud' && 'Common patterns in support tickets'}
              {visualizationType === 'satisfaction' && 'Customer satisfaction trends'}
            </p>
          </div>
          <select 
            className="select select-bordered bg-gray-700 text-gray-100 border-gray-600"
            value={visualizationType}
            onChange={(e) => setVisualizationType(e.target.value as VisualizationType)}
          >
            <option value="wordCloud">Common Issues</option>
            <option value="satisfaction">Customer Satisfaction</option>
          </select>
        </div>
        <div ref={containerRef} className="h-[500px] w-full mt-4 relative">
          {(visualizationType === 'wordCloud' && words.length > 0) || 
           (visualizationType === 'satisfaction' && satisfactionData.length > 0) ? (
            <svg
              ref={svgRef}
              className="w-full h-full absolute inset-0"
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}