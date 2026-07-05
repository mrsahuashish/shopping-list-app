'use client';

// Converts a File to base64 string (without the data:...;base64, prefix)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data URI prefix
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export async function uploadToImgBB(file: File): Promise<string> {
  const key = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_IMGBB_API_KEY is not set. Add it to Vercel Environment Variables.'
    );
  }

  const base64 = await fileToBase64(file);

  const form = new FormData();
  form.append('image', base64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? `ImgBB upload failed (${res.status})`);
  }

  const json = await res.json();

  if (!json.success || !json.data?.url) {
    throw new Error('ImgBB returned an unexpected response');
  }

  return json.data.url as string;
}
