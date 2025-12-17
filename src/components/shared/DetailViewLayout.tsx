'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Edit,
  Building,
  Ruler,
  Eye as EyeIcon,
  MapPin,
} from 'lucide-react';
import { GoogleMapsPicker } from './GoogleMapsPicker';

export interface DetailViewLayoutProps {
  title: string;
  badges: React.ReactNode;
  onClose: () => void;
  onEdit: () => void;
  editLabel: string;
  mainContent: React.ReactNode;
  location?: any;
  onImageClick?: (src: string) => void;
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className='flex gap-3 mb-4'>
      {Icon && (
        <Icon className='h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5' />
      )}
      <div className='flex-1'>
        <p className='text-sm font-semibold text-muted-foreground'>{label}</p>
        <div className='text-base text-foreground break-words'>{value}</div>
      </div>
    </div>
  );
}

export function DetailViewLayout({
  title,
  badges,
  onClose,
  onEdit,
  editLabel,
  mainContent,
  location,
  onImageClick,
}: DetailViewLayoutProps) {
  const position =
    location?.latitude && location?.longitude
      ? {
          lat:
            typeof location.latitude === 'string'
              ? location.latitude
              : String(location.latitude),
          lng:
            typeof location.longitude === 'string'
              ? location.longitude
              : String(location.longitude),
        }
      : null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='flex items-center gap-4 flex-wrap'>
          <Button variant='outline' size='icon' onClick={onClose}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold mb-2'>{title}</h1>
            <div className='flex items-center gap-2 flex-wrap'>{badges}</div>
          </div>
        </div>
        <Button onClick={onEdit} variant='outline'>
          <Edit className='mr-2 h-4 w-4' /> {editLabel}
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Content Area */}
        <div className='lg:col-span-2 space-y-6'>{mainContent}</div>

        {/* Sidebar */}
        {location && (
          <div className='lg:col-span-1 space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building /> Associated Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label='Location Name' value={location.name} />
                <InfoRow label='Address' value={location.addressLine} />
                <InfoRow label='District/Ward' value={location.addressLevel1} />
                <InfoRow label='Province/City' value={location.addressLevel2} />
                <InfoRow
                  label='Radius (m)'
                  value={location.radiusMeters}
                  icon={Ruler}
                />
                <InfoRow
                  label='Visible on Map'
                  value={location.isVisibleOnMap ? 'Yes' : 'No'}
                  icon={EyeIcon}
                />
                {location.imageUrl && location.imageUrl.length > 0 && (
                  <div className='mt-4 space-y-2'>
                    <p className='text-sm font-semibold text-muted-foreground'>
                      Location Images
                    </p>
                    <div className='flex flex-wrap gap-3'>
                      {location.imageUrl.map((url: string, index: number) => (
                        <img
                          key={index}
                          src={url}
                          alt='Location'
                          onClick={() => onImageClick?.(url)}
                          className='w-24 h-24 rounded-md border object-cover cursor-pointer hover:opacity-80 transition-opacity'
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
