const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export async function getOrdinators(token) {
  const res = await fetch(`${API_URL}/ordinators`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error('Ошибка загрузки ординаторов');
  return res.json();
}

export async function createOrdinator(dto) {
  const token = localStorage.getItem('auth_token');
  console.log('Токен для создания:', token);
  const res = await fetch(`${API_URL}/ordinators`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(dto)
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Ошибка создания:', errorText);
    throw new Error('Ошибка создания ординатора');
  }
  return res.json();
}

export async function updateOrdinator(id, dto, token) {
  const res = await fetch(`${API_URL}/ordinators/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(dto)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Ошибка обновления:', errorText);
    throw new Error('Ошибка обновления ординатора');
  }

  return res.json();
}

export async function deleteOrdinator(id, token) {
  const res = await fetch(`${API_URL}/ordinators/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Ошибка удаления:', errorText);
    throw new Error('Ошибка удаления ординатора');
  }
}
