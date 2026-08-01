import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Renders a DOM element into a downloadable PDF.
 * Uses html2canvas-pro because the app relies on Tailwind v4 oklch/oklab
 * color tokens, which the standard html2canvas cannot parse.
 */
export const elementToPdf = async (
  element: HTMLElement,
  options: { filename?: string; background?: string; scale?: number } = {}
): Promise<void> => {
  const { filename = 'document.pdf', background = '#ffffff', scale = 2 } = options;

  const canvas = await html2canvas(element, {
    backgroundColor: background,
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
};
