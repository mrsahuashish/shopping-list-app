interface DateCardProps {
  date: string;
}

export default function DateCard({ date }: DateCardProps) {
  const dateObj = new Date(date + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = dateObj.toLocaleDateString('en-US', options);

  return (
    <div className="bg-accent/20 border border-accent rounded-lg p-4">
      <p className="text-sm text-muted-foreground">Today&apos;s Date</p>
      <p className="text-xl font-semibold text-foreground">{formattedDate}</p>
    </div>
  );
}
