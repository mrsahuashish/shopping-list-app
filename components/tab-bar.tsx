type TabType = 'today' | 'all' | 'done';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'today', label: 'Today', icon: '📅' },
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'done', label: 'Done', icon: '✓' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around md:max-w-2xl md:mx-auto md:w-full">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2.5 px-4 text-center transition-colors ${
            activeTab === tab.id
              ? 'text-primary border-t-2 border-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
