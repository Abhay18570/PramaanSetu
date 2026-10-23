import { maxFileSize } from '../applications/config.ts'
export async function validateFile(file: File): Promise<string> {
  if (file.size > maxFileSize) throw new Error('File must be 10 MB or smaller.')
  if (!file.size) throw new Error('The selected file is empty.')
  const extension = file.name.split('.').pop()?.toLowerCase()
  const expected =
    extension === 'pdf'
      ? 'application/pdf'
      : extension === 'png'
        ? 'image/png'
        : extension === 'jpg' || extension === 'jpeg'
          ? 'image/jpeg'
          : null
  if (!expected || (file.type && file.type !== expected))
    throw new Error('Only PDF, JPG and PNG files are supported.')
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const valid =
    expected === 'application/pdf'
      ? String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-'
      : expected === 'image/png'
        ? [137, 80, 78, 71, 13, 10, 26, 10].every(
            (value, index) => bytes[index] === value,
          )
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (!valid)
    throw new Error('File content does not match its PDF or image format.')
  return expected
}
