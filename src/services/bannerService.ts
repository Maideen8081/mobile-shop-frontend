import api from './api'

export async function getBanners() {
  // Expected backend response: [{ id, title, subtitle, image, link, accentColor }, ...]
  const res = await api.get('/banners')
  return res.data
}

export default { getBanners }
