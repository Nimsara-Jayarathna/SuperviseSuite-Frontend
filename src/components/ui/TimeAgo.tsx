import React, { useMemo } from 'react';

type TimeAgoProps = {
  date: string | number | Date;
  className?: string;
  addSuffix?: boolean;
};

export function TimeAgo({ date, className, addSuffix = true }: TimeAgoProps) {
  const relativeTime = useMemo(() => {
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m${addSuffix ? ' ago' : ''}`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h${addSuffix ? ' ago' : ''}`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d${addSuffix ? ' ago' : ''}`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w${addSuffix ? ' ago' : ''}`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo${addSuffix ? ' ago' : ''}`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y${addSuffix ? ' ago' : ''}`;
  }, [date, addSuffix]);

  return (
    <time dateTime={new Date(date).toISOString()} className={className}>
      {relativeTime}
    </time>
  );
}
