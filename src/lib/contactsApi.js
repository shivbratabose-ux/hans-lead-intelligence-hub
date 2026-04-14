import { supabase } from './supabase';

/**
 * Fetch contacts from Supabase with server-side filtering and pagination.
 */
export async function fetchContacts({
  industry = '',
  country = '',
  region = '',
  contactType = '',
  source = '',
  emailFilter = '',
  phoneFilter = '',
  search = '',
  page = 1,
  perPage = 30,
} = {}) {
  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' });

  // Apply filters
  if (industry) query = query.eq('industry', industry);
  if (country) query = query.eq('country', country);
  if (region) query = query.eq('region', region);
  if (contactType) query = query.eq('contact_type', contactType);
  if (source) query = query.eq('source', source);

  if (emailFilter === 'yes') query = query.ilike('email', '%@%');
  if (emailFilter === 'no') query = query.or('email.is.null,email.not.ilike.%@%');

  if (phoneFilter === 'yes') query = query.gt('phone', '1234'); // phone length > 4
  if (phoneFilter === 'no') query = query.or('phone.is.null,phone.lte.1234');

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(`name.ilike.${q},company.ilike.${q},email.ilike.${q},title.ilike.${q},location.ilike.${q}`);
  }

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to).order('company', { ascending: true });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching contacts:', error);
    return { contacts: [], total: 0, error: error.message };
  }

  return { contacts: data || [], total: count || 0, error: null };
}

/**
 * Fetch all contacts for export (admin-only, with audit logging)
 */
export async function fetchContactsForExport(filters = {}, userEmail = '') {
  let query = supabase
    .from('contacts')
    .select('*');

  if (filters.industry) query = query.eq('industry', filters.industry);
  if (filters.country) query = query.eq('country', filters.country);
  if (filters.region) query = query.eq('region', filters.region);
  if (filters.contactType) query = query.eq('contact_type', filters.contactType);
  if (filters.source) query = query.eq('source', filters.source);

  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${q},company.ilike.${q},email.ilike.${q}`);
  }

  const { data, error } = await query.order('company', { ascending: true });

  if (error) {
    return { contacts: [], error: error.message };
  }

  // Log the export
  await supabase.from('export_audit_log').insert({
    user_email: userEmail,
    action: 'download',
    page: 'Contact Explorer',
    record_count: data?.length || 0,
    details: filters,
  });

  return { contacts: data || [], error: null };
}

/**
 * Fetch contacts summary stats (industry breakdown, totals)
 */
export async function fetchContactsSummary() {
  // Supabase limits to 1000 rows per request — paginate to get all
  let allData = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('contacts')
      .select('industry, email, phone, linkedin, contact_type')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching summary batch:', error);
      break;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  // Build industry summary
  const industryMap = {};
  let totalEmails = 0, totalPhones = 0, totalLinkedin = 0, totalExisting = 0;

  allData.forEach(c => {
    if (!industryMap[c.industry]) {
      industryMap[c.industry] = { industry: c.industry, count: 0, withEmail: 0, withPhone: 0, withLinkedin: 0 };
    }
    industryMap[c.industry].count++;

    const hasEmail = c.email && c.email.includes('@');
    const hasPhone = c.phone && c.phone.length > 4;
    const hasLinkedin = !!c.linkedin;

    if (hasEmail) { industryMap[c.industry].withEmail++; totalEmails++; }
    if (hasPhone) { industryMap[c.industry].withPhone++; totalPhones++; }
    if (hasLinkedin) { industryMap[c.industry].withLinkedin++; totalLinkedin++; }
    if (c.contact_type === 'Existing Customer') totalExisting++;
  });

  const industrySummary = Object.values(industryMap).sort((a, b) => b.count - a.count);

  return {
    total: allData.length,
    totalEmails,
    totalPhones,
    totalLinkedin,
    totalExisting,
    industrySummary,
  };
}

/**
 * Fetch filter options (distinct values for dropdowns)
 */
export async function fetchFilterOptions() {
  // Paginate to get all distinct values
  let allData = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from('contacts')
      .select('country, region, contact_type, source')
      .range(from, from + batchSize - 1);

    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }

  const countries = [...new Set(allData.map(c => c.country).filter(Boolean))].sort();
  const regions = [...new Set(allData.map(c => c.region).filter(Boolean))].sort();
  const contactTypes = [...new Set(allData.map(c => c.contact_type).filter(Boolean))].sort();
  const sources = [...new Set(allData.map(c => c.source).filter(Boolean))].sort();

  return { countries, regions, contactTypes, sources };
}
