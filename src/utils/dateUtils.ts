import moment from 'moment';

export const formatDisplayDate = (date: string | null | undefined): string => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

export const formatInputDate = (date: string | null | undefined): string => {
  if (!date) return '';
  return moment(date).format('YYYY-MM-DD');
};

export const parseInputDate = (date: string): string => {
  if (!date) return '';
  return moment(date).startOf('day').toISOString();
};
