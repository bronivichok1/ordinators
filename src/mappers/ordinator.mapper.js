function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function normalizeDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

export function mapOrdinatorDtoToTableRow(dto) {
  const edu = dto.educationInfo || null;
  const uni = dto.universities?.[0] || null;
  const money = dto.money?.[0] || null;
  const session = dto.sessions?.[0] || null;
  const vacation = dto.vacations?.[0] || null;
  const control = dto.currentControls?.[0] || null;

  return {
    id: dto.id,

    fullNameRu: `${dto.lastname_ru || ''} ${dto.firstname_ru || ''} ${dto.patronymic_ru || ''}`.trim(),
    fullNameEn: `${dto.lastname_en || ''} ${dto.firstname_en || ''} ${dto.patronymic_en || ''}`.trim(),

    birthDate: formatDate(dto.birth_date),
    gender: dto.gender || '',
    country: dto.country || '',
    mobile: dto.mobile || '',
    email: dto.email || '',

    dateEnrollment: formatDate(edu?.date_enrollment),
    numberEnrollment: edu?.number_enrollment || '',
    dateExpulsion: formatDate(edu?.date_expulsion),
    numberExpulsion: edu?.number_expulsion || '',
    reasonExpulsion: edu?.reason_expulsion || '',

    universityName: uni?.name || '',
    graduationYear: formatDate(uni?.graduation_year),
    department: uni?.department || '',
    profile: uni?.profile || '',
    speciality: uni?.speciality || '',
    educationForm: uni?.education_form ? JSON.parse(uni.education_form).join(', ') : '',

    moneyStart: formatDate(money?.start),
    moneyEnd: formatDate(money?.end),

    sessionStart: formatDate(session?.start),
    sessionEnd: formatDate(session?.end),

    vacationCause: vacation?.cause || '',
    vacationDuration: vacation?.duration || '',

    controlDate: formatDate(control?.control_date),
    controlResult: control?.result || '',

    medicalcertificate: dto.medicalcertificate === 'Y' ? 'Да' : 'Нет',
    rivshcertificate: dto.rivshcertificate === 'Y' ? 'Да' : 'Нет',
    invite: dto.invite === 'Y',

    docType: dto.doc_type || '',
    pasnumber: dto.pasnumber || '',
    agreement: dto.agreement || '',
    distribution: dto.distribution || '',
    teacher: dto.teacher || '',
    livingPlace: dto.living_place || '',
    registrationDeadline: formatDate(dto.registration_deadline),
  };
}

export function mapTableRowToOrdinatorDto(row) {
  const [lastname_ru = '', firstname_ru = '', patronymic_ru = ''] =
    (row.fullNameRu || '').split(' ');

  const [lastname_en = '', firstname_en = '', patronymic_en = ''] =
    (row.fullNameEn || '').split(' ');

  return {
    pasnumber: row.pasnumber || '',

    lastname_ru,
    firstname_ru,
    patronymic_ru,

    lastname_en,
    firstname_en,
    patronymic_en,

    birth_date: normalizeDate(row.birthDate),
    gender: row.gender || '',
    country: row.country || '',
    mobile: row.mobile || '',
    email: row.email || '',

    medicalcertificate: row.medicalcertificate ? 'Y' : 'N',
    rivshcertificate: row.rivshcertificate ? 'Y' : 'N',
    invite: row.invite ? 'Y' : 'N',

    doc_type: row.docType || '',
    agreement: row.agreement || '',
    distribution: row.distribution || '',
    teacher: row.teacher || '',
    living_place: row.livingPlace || '',
    registration_deadline: normalizeDate(row.registrationDeadline),

    educationInfo: 
      {
        date_enrollment: normalizeDate(row.dateEnrollment),
        number_enrollment: row.numberEnrollment || '',
        date_expulsion: normalizeDate(row.dateExpulsion),
        number_expulsion: row.numberExpulsion || '',
        reason_expulsion: row.reasonExpulsion || '',
      },

    universities: [
      {
        name: row.universityName || '',
        graduation_year: row.graduationYear || null,
        department: row.department || '',
        profile: row.profile || '',
        speciality: row.speciality || '',
        education_form: row.educationForm ? JSON.stringify(row.educationForm.split(',').map(s => s.trim())) : '[]',
      },
    ],

    money: [
      {
        start: normalizeDate(row.moneyStart),
        end: normalizeDate(row.moneyEnd),
      },
    ],

    sessions: [
      {
        start: normalizeDate(row.sessionStart),
        end: normalizeDate(row.sessionEnd),
      },
    ],

    vacations: [
      {
        cause: row.vacationCause || '',
        duration: row.vacationDuration || '',
      },
    ],

    currentControls: [
      {
        control_date: row.controlDate || null,
        result: row.controlResult || '',
      },
    ],
  };
}
