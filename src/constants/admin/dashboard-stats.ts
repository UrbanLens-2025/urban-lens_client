import {
  IconCalendar,
  IconClock,
  IconCurrencyDollar,
  IconMap,
  IconMapPin,
  IconRotateClockwise,
  IconUser,
} from '@tabler/icons-react';

export const dashboardStats = [
  {
    title: 'Total Users',
    value: '12,847',
    change: '+8.2% this week',
    icon: IconUser,
    color: 'blue',
  },
  {
    title: 'Active Locations',
    value: '1,456',
    change: '+12 new locations',
    icon: IconMapPin,
    color: 'green',
  },
  {
    title: 'Upcoming Events',
    value: '89',
    change: '15 in this week',
    icon: IconCalendar,
    color: 'purple',
  },
  {
    title: 'Today Revenue',
    value: '₫2.4M',
    change: '+15.3% compared to yesterday',
    icon: IconCurrencyDollar,
    color: 'green',
  },
  {
    title: 'Pending Content',
    value: '23',
    change: '5 new today',
    icon: IconClock,
    color: 'orange',
  },
];
