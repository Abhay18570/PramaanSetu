declare module 'pdfjs-dist' {
  export const GlobalWorkerOptions: { workerSrc: string }
  export const Util: { transform(a: number[], b: number[]): number[] }
  export function getDocument(source: { data: ArrayBuffer }): { promise: Promise<PDFDocumentProxy> }
  export interface PDFDocumentProxy { numPages: number; getPage(page: number): Promise<PDFPageProxy>; destroy(): Promise<void> }
  export interface PDFPageProxy { getViewport(options: { scale: number; rotation?: number }): { width: number; height: number; transform: number[] }; render(options: Record<string, unknown>): { promise: Promise<void>; cancel(): void }; getTextContent(): Promise<{items: Array<{str?:string;width?:number;transform?:number[]}>}> }
}
declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' { const url: string; export default url }
