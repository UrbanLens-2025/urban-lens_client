import {
  Icon24Hours,
  IconCalendar,
  IconMap,
  IconUsers,
} from '@tabler/icons-react';

export const locationStats = [
  {
    title: 'Approved Locations',
    value: '1,456',
    change: '+12 new locations',
    icon: IconMap,
    color: 'green',
  },
  {
    title: 'Pending Requests',
    value: '5',
    change: '5 new today',
    icon: Icon24Hours,
    color: 'orange',
  },
  {
    title: 'Total Check-ins',
    value: '2,847',
    change: '+18% vs last week',
    icon: IconUsers,
    color: 'blue',
  },
  {
    title: 'Business Locations',
    value: '892',
    change: '61% of total',
    icon: IconCalendar,
    color: 'purple',
  },
];
