"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, Palette, Monitor, Smartphone, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TournamentPosterProps {
  tournament: {
    name: string;
    format: string;
    customFormat?: string;
    venue: string;
    venueAddress?: string;
    startDate: string;
    endDate?: string;
    registrationDeadline?: string;
    totalPrizePool: number;
    entryFee: number;
    maxTeams?: number;
    teamSize: number;
    ageLimit?: string;
    organizers?: string;
    winners?: string;
    otherPrizes?: string;
    rules?: string;
    status: string;
    description?: string;
    overs?: number;
  };
  onDownload?: () => void;
}

type PosterTemplate = 'modern' | 'classic' | 'professional' | 'cricket';
type PosterSize = 'story' | 'post' | 'banner';

const posterSizes = {
  story: { width: 1080, height: 1920, name: 'Instagram Story', icon: Smartphone },
  post: { width: 1080, height: 1080, name: 'Instagram Post', icon: Square },
  banner: { width: 1200, height: 630, name: 'Facebook Banner', icon: Monitor }
};

const templates = {
  modern: { name: 'Modern', colors: ['#667eea', '#764ba2'], icon: '🎨' },
  classic: { name: 'Classic', colors: ['#2196F3', '#4CAF50'], icon: '🏛️' },
  professional: { name: 'Professional', colors: ['#1e3c72', '#2a5298'], icon: '💼' },
  cricket: { name: 'Cricket', colors: ['#FFA726', '#FF7043'], icon: '🏏' }
};

const TournamentPosterGenerator: React.FC<TournamentPosterProps> = ({ tournament, onDownload }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PosterTemplate>('modern');
  const [selectedSize, setSelectedSize] = useState<PosterSize>('story');
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseJsonField = (jsonString?: string) => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };  const generateSVGPoster = () => {
    const size = posterSizes[selectedSize];
    const template = templates[selectedTemplate];
    const isVertical = size.height > size.width;
    
    const tournamentName = tournament.name || 'Cricket Tournament';
    const titleFontSize = isVertical ? Math.min(50, 500 / tournamentName.length * 5) : Math.min(40, 400 / tournamentName.length * 4);
    
    const organizers = parseJsonField(tournament.organizers);
    const winners = parseJsonField(tournament.winners);
    const otherPrizes = parseJsonField(tournament.otherPrizes);

    const svgContent = `
      <svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${template.colors[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${template.colors[1]};stop-opacity:1" />
          </linearGradient>
          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.2);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          ${selectedTemplate === 'cricket' ? `
          <pattern id="cricketPattern" patternUnits="userSpaceOnUse" width="100" height="100" opacity="0.08">
            <circle cx="50" cy="50" r="30" fill="none" stroke="white" stroke-width="2"/>
            <circle cx="50" cy="50" r="15" fill="none" stroke="white" stroke-width="1"/>
          </pattern>
          ` : ''}
        </defs>

        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bgGradient)"/>
        ${selectedTemplate === 'cricket' ? '<rect width="100%" height="100%" fill="url(#cricketPattern)"/>' : ''}
          <!-- Header Section -->
        <g transform="translate(${size.width / 2}, ${isVertical ? 80 : 60})">
          <circle cx="0" cy="0" r="35" fill="rgba(255,255,255,0.2)" filter="url(#shadow)"/>
          <text x="0" y="12" text-anchor="middle" font-size="40" fill="white" filter="url(#glow)">🏏</text>
        </g>

        <!-- Tournament Title -->
        <text x="${size.width / 2}" y="${isVertical ? 150 : 115}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="${titleFontSize}" 
              font-weight="bold" 
              fill="white" 
              filter="url(#glow)">
          ${tournamentName.length > 35 ? tournamentName.substring(0, 32) + '...' : tournamentName}
        </text>

        <!-- Status Badge -->
        <g transform="translate(${size.width / 2}, ${isVertical ? 190 : 150})">
          <rect x="-65" y="-12" width="130" height="24" rx="12" fill="rgba(255,215,0,0.95)" filter="url(#shadow)"/>
          <text x="0" y="4" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1a1a1a">
            ${tournament.status.replace('_', ' ').toUpperCase()}
          </text>
        </g>        <!-- Key Information Cards -->
        <g transform="translate(40, ${isVertical ? 230 : 185})">
          <!-- Date Card -->
          <rect x="0" y="0" width="${(size.width - 120) / 3}" height="110" rx="15" fill="url(#cardGradient)" filter="url(#shadow)"/>
          <rect x="5" y="5" width="${(size.width - 120) / 3 - 10}" height="100" rx="12" fill="rgba(255,255,255,0.1)"/>
          <text x="${(size.width - 120) / 6}" y="30" text-anchor="middle" font-size="28" fill="#FFD700">📅</text>
          <text x="${(size.width - 120) / 6}" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">
            ${formatDate(tournament.startDate)}
          </text>
          <text x="${(size.width - 120) / 6}" y="67" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.9)">
            ${formatTime(tournament.startDate)}
          </text>          <text x="${(size.width - 120) / 6}" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="600" fill="#FFD700">
            START DATE
          </text>

          <!-- Venue Card -->
          <rect x="${(size.width - 120) / 3 + 20}" y="0" width="${(size.width - 120) / 3}" height="110" rx="15" fill="url(#cardGradient)" filter="url(#shadow)"/>
          <rect x="${(size.width - 120) / 3 + 25}" y="5" width="${(size.width - 120) / 3 - 10}" height="100" rx="12" fill="rgba(255,255,255,0.1)"/>
          <text x="${(size.width - 120) / 3 + 20 + (size.width - 120) / 6}" y="30" text-anchor="middle" font-size="28" fill="#FFD700">📍</text>
          <text x="${(size.width - 120) / 3 + 20 + (size.width - 120) / 6}" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white">
            ${tournament.venue.length > 16 ? tournament.venue.substring(0, 13) + '...' : tournament.venue}
          </text>
          <text x="${(size.width - 120) / 3 + 20 + (size.width - 120) / 6}" y="67" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="rgba(255,255,255,0.9)">
            ${tournament.venueAddress ? (tournament.venueAddress.length > 18 ? tournament.venueAddress.substring(0, 15) + '...' : tournament.venueAddress) : 'Cricket Ground'}
          </text>
          <text x="${(size.width - 120) / 3 + 20 + (size.width - 120) / 6}" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="600" fill="#FFD700">
            VENUE
          </text>

          <!-- Prize Pool Card -->
          <rect x="${2 * (size.width - 120) / 3 + 40}" y="0" width="${(size.width - 120) / 3}" height="110" rx="15" fill="url(#cardGradient)" filter="url(#shadow)"/>
          <rect x="${2 * (size.width - 120) / 3 + 45}" y="5" width="${(size.width - 120) / 3 - 10}" height="100" rx="12" fill="rgba(255,255,255,0.1)"/>
          <text x="${2 * (size.width - 120) / 3 + 40 + (size.width - 120) / 6}" y="30" text-anchor="middle" font-size="28" fill="#FFD700">🏆</text>
          <text x="${2 * (size.width - 120) / 3 + 40 + (size.width - 120) / 6}" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">
            ₹${tournament.totalPrizePool?.toLocaleString() || '0'}
          </text>
          <text x="${2 * (size.width - 120) / 3 + 40 + (size.width - 120) / 6}" y="67" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="rgba(255,255,255,0.9)">
            Entry Fee: ₹${tournament.entryFee || 0}
          </text>
          <text x="${2 * (size.width - 120) / 3 + 40 + (size.width - 120) / 6}" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="600" fill="#FFD700">
            PRIZE POOL
          </text></g>

        <!-- Tournament Details Section -->
        ${isVertical ? `
        <g transform="translate(40, 360)">
          <rect x="0" y="0" width="${size.width - 80}" height="170" rx="18" fill="url(#cardGradient)" filter="url(#shadow)"/>
          <rect x="8" y="8" width="${size.width - 96}" height="154" rx="12" fill="rgba(255,255,255,0.08)"/>
            <text x="25" y="30" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#FFD700">
            📋 TOURNAMENT DETAILS
          </text>
          
          <text x="25" y="52" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="white">
            ${tournament.overs ? `${tournament.overs} Overs Cricket` : (tournament.customFormat || tournament.format)}
          </text>
          
          <text x="25" y="72" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.9)">
            Team Size: ${tournament.teamSize} players${tournament.maxTeams ? ` • Max Teams: ${tournament.maxTeams}` : ''}
          </text>
          
          ${tournament.registrationDeadline ? `
          <text x="25" y="92" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.9)">
            Registration Deadline: ${formatDate(tournament.registrationDeadline)}
          </text>
          ` : ''}
          
          ${tournament.ageLimit ? `
          <text x="25" y="112" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.9)">
            Age Limit: ${tournament.ageLimit}
          </text>
          ` : ''}
          
          <text x="25" y="140" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="#FFD700">
            📞 Contact for Registration
          </text>
          
          <text x="25" y="158" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)">
            Tunda Sports Club - Join us for an exciting cricket tournament!
          </text>
        </g>
        ` : `
        <g transform="translate(40, 315)">
          <rect x="0" y="0" width="${size.width - 80}" height="95" rx="15" fill="url(#cardGradient)" filter="url(#shadow)"/>
          <rect x="6" y="6" width="${size.width - 92}" height="83" rx="12" fill="rgba(255,255,255,0.08)"/>
            <text x="25" y="22" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#FFD700">
            ${tournament.overs ? `${tournament.overs} Overs Cricket` : (tournament.customFormat || tournament.format)} • Team Size: ${tournament.teamSize}
          </text>
          
          <text x="25" y="42" font-family="Arial, sans-serif" font-size="11" fill="rgba(255,255,255,0.9)">
            ${tournament.maxTeams ? `Max Teams: ${tournament.maxTeams} • ` : ''}${tournament.ageLimit ? `Age: ${tournament.ageLimit} • ` : ''}Entry Fee: ₹${tournament.entryFee || 0}
          </text>
          
          <text x="25" y="62" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)">
            ${tournament.registrationDeadline ? `Registration Deadline: ${formatDate(tournament.registrationDeadline)}` : 'Contact for Registration Details'}
          </text>
          
          <text x="25" y="80" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.7)">
            📞 Contact Tunda Sports Club
          </text>
        </g>
        `}        <!-- Winners Section -->
        ${winners.length > 0 && (tournament.status === 'COMPLETED' || tournament.status === 'ONGOING') ? `
        <g transform="translate(${size.width / 2}, ${isVertical ? 560 : 430})">
          <text x="0" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#FFD700">
            🏆 WINNERS
          </text>
          ${winners.slice(0, 3).map((winner: any, index: number) => `
            <text x="0" y="${22 + index * 18}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="white">
              ${winner.position}: ${winner.teamName || winner.playerName || 'TBD'}
            </text>
          `).join('')}
        </g>
        ` : ''}        <!-- Organizers Section -->
        ${organizers.length > 0 ? `
        <g transform="translate(${size.width / 2}, ${isVertical ? size.height - 105 : size.height - 80})">
          <text x="0" y="0" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="rgba(255,255,255,0.9)">
            Organized by
          </text>
          ${organizers.slice(0, 2).map((organizer: any, index: number) => `
            <text x="0" y="${17 + index * 14}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.8)">
              ${organizer.name} ${organizer.role ? `(${organizer.role})` : ''}
            </text>
          `).join('')}
          ${organizers.length > 0 && organizers[0].contact ? `
          <text x="0" y="${17 + Math.min(organizers.length, 2) * 14 + 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="rgba(255,255,255,0.7)">
            📱 ${organizers[0].contact}
          </text>
          ` : ''}
        </g>
        ` : ''}        <!-- Footer -->
        <rect x="0" y="${size.height - 55}" width="${size.width}" height="55" fill="rgba(0,0,0,0.5)"/>
        <text x="${size.width / 2}" y="${size.height - 30}" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="white">
          🏏 TUNDA SPORTS CLUB 🏏
        </text>
        <text x="${size.width / 2}" y="${size.height - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="rgba(255,255,255,0.9)">
          Join us for an exciting cricket tournament experience!
        </text>
      </svg>
    `;

    return svgContent;
  };

  const convertSVGToPNG = async (svgContent: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not found'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not found'));
        return;
      }

      const size = posterSizes[selectedSize];
      canvas.width = size.width;
      canvas.height = size.height;

      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const dataURL = canvas.toDataURL('image/png', 1.0);
        resolve(dataURL);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };

      img.src = url;
    });
  };

  const downloadPoster = async () => {
    setIsGenerating(true);
    try {
      const svgContent = generateSVGPoster();
      const dataURL = await convertSVGToPNG(svgContent);
      
      const link = document.createElement('a');
      link.download = `${tournament.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_poster_${selectedSize}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onDownload?.();
    } catch (error) {
      console.error('Error generating poster:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const sharePoster = async () => {
    if (navigator.share) {
      try {
        const svgContent = generateSVGPoster();
        const dataURL = await convertSVGToPNG(svgContent);
        const response = await fetch(dataURL);
        const blob = await response.blob();
        const file = new File([blob], `${tournament.name}_poster.png`, { type: 'image/png' });
        
        await navigator.share({
          title: tournament.name,
          text: `Check out this tournament: ${tournament.name}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing poster:', error);
        downloadPoster(); // Fallback to download
      }
    } else {
      downloadPoster(); // Fallback to download
    }
  };

  useEffect(() => {
    // Generate initial poster preview
    const svgContent = generateSVGPoster();
    if (canvasRef.current) {
      convertSVGToPNG(svgContent).catch(console.error);
    }
  }, [selectedTemplate, selectedSize, tournament]);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5" />
          Tournament Poster Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection - Card Grid */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Choose Template</label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(templates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setSelectedTemplate(key as PosterTemplate)}
                className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedTemplate === key
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-muted hover:border-primary/50 bg-card'
                }`}
              >
                <div 
                  className="w-full h-8 rounded mb-2"
                  style={{ 
                    background: `linear-gradient(45deg, ${template.colors[0]}, ${template.colors[1]})` 
                  }}
                />
                <div className="text-center">
                  <div className="text-lg mb-1">{template.icon}</div>
                  <div className="text-xs font-medium">{template.name}</div>
                </div>
                {selectedTemplate === key && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Size Selection - Card Grid */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Choose Size</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(posterSizes).map(([key, size]) => {
              const IconComponent = size.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSize(key as PosterSize)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    selectedSize === key
                      ? 'border-primary bg-primary/10 shadow-md'
                      : 'border-muted hover:border-primary/50 bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">{size.name}</div>
                      <div className="text-xs text-muted-foreground">{size.width}×{size.height}</div>
                    </div>
                    {selectedSize === key && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview Canvas (hidden but needed for conversion) */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={posterSizes[selectedSize].width}
          height={posterSizes[selectedSize].height}
        />        {/* SVG Preview */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Preview</label>
          <div className="border rounded-lg p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="flex justify-center">
              <div 
                className="border-2 border-white rounded-lg overflow-hidden shadow-lg bg-white"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  aspectRatio: `${posterSizes[selectedSize].width} / ${posterSizes[selectedSize].height}`,
                  height: 'auto'
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${posterSizes[selectedSize].width} ${posterSizes[selectedSize].height}`}
                  style={{ display: 'block' }}
                  dangerouslySetInnerHTML={{ __html: generateSVGPoster().replace(/<svg[^>]*>|<\/svg>/g, '') }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={downloadPoster} 
            disabled={isGenerating}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            <Download className="h-5 w-5 mr-2" />
            {isGenerating ? 'Generating Poster...' : 'Download High-Quality PNG'}
          </Button>
          <Button 
            onClick={sharePoster} 
            variant="outline"
            disabled={isGenerating}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share Poster
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            📱 Perfect for Instagram, Facebook, and WhatsApp sharing
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            High-resolution PNG output • Professional quality • Ready to share
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentPosterGenerator;
