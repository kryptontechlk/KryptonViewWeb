import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Invoice } from '../types';

// Robust parsing of oklch color parameters
function parseOklchParams(inner: string) {
  // Normalize commas to spaces
  let clean = inner.replace(/,/g, ' ').trim();
  // Handle slash / for alpha
  let alphaStr: string | undefined = undefined;
  if (clean.includes('/')) {
    const parts = clean.split('/');
    clean = parts[0].trim();
    alphaStr = parts[1].trim();
  }

  // Split on multiple spaces
  const tokens = clean.split(/\s+/);
  if (tokens.length < 3) return null;

  return {
    l: tokens[0],
    c: tokens[1],
    h: tokens[2],
    alpha: alphaStr
  };
}

// Full mathematical conversion from OKLCH to standard sRGB matching RGB/RGBA color strings
function oklchToRgb(oklchStr: string): string {
  try {
    const match = oklchStr.match(/oklch\s*\(\s*([^)]+)\)/i);
    if (!match) return 'rgb(120, 130, 140)';
    
    const params = parseOklchParams(match[1]);
    if (!params) return 'rgb(120, 130, 140)';

    const { l, c, h, alpha: alphaStr } = params;

    let L = l.endsWith('%') ? parseFloat(l) / 100 : parseFloat(l);
    let C = parseFloat(c);
    let H = h.endsWith('deg') ? parseFloat(h) : parseFloat(h);

    if (isNaN(L) || isNaN(C) || isNaN(H)) {
      // Return predefined fallback primaries if they are mapped CSS color variables
      if (oklchStr.includes('--color-indigo')) return 'rgb(99, 102, 241)';
      if (oklchStr.includes('--color-emerald')) return 'rgb(16, 185, 129)';
      if (oklchStr.includes('--color-slate')) return 'rgb(100, 116, 139)';
      if (oklchStr.includes('--color-sky')) return 'rgb(14, 165, 233)';
      return 'rgb(120, 130, 140)';
    }

    // Normalize Hue to [0, 360]
    H = ((H % 360) + 360) % 360;

    let alpha = 1;
    if (alphaStr) {
      alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
      if (isNaN(alpha)) alpha = 1;
    }

    // Convert to OKLAB
    const a = C * Math.cos((H * Math.PI) / 180);
    const b = C * Math.sin((H * Math.PI) / 180);

    // OKLAB to Linear sRGB
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l_cube = l_ * l_ * l_;
    const m_cube = m_ * m_ * m_;
    const s_cube = s_ * s_ * s_;

    const r = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
    const g = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
    const b_res = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.707614701 * s_cube;

    // Linear sRGB to standard sRGB
    const f = (x: number) => {
      if (x <= 0.0031308) return 12.92 * x;
      return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    };

    const R = Math.max(0, Math.min(255, Math.round(f(r) * 255)));
    const G = Math.max(0, Math.min(255, Math.round(f(g) * 255)));
    const B = Math.max(0, Math.min(255, Math.round(f(b_res) * 255)));

    if (alpha === 1) {
      return `rgb(${R}, ${G}, ${B})`;
    } else {
      return `rgba(${R}, ${G}, ${B}, ${alpha})`;
    }
  } catch (err) {
    return 'rgb(120, 130, 140)';
  }
}

// Robust parsing of oklab color parameters
function parseOklabParams(inner: string) {
  let clean = inner.replace(/,/g, ' ').trim();
  let alphaStr: string | undefined = undefined;
  if (clean.includes('/')) {
    const parts = clean.split('/');
    clean = parts[0].trim();
    alphaStr = parts[1].trim();
  }

  const tokens = clean.split(/\s+/);
  if (tokens.length < 3) return null;

  return {
    l: tokens[0],
    a: tokens[1],
    b: tokens[2],
    alpha: alphaStr
  };
}

// Convert OKLAB standard format directly to RGB
function oklabToRgb(oklabStr: string): string {
  try {
    const match = oklabStr.match(/oklab\s*\(\s*([^)]+)\)/i);
    if (!match) return 'rgb(120, 130, 140)';
    
    const params = parseOklabParams(match[1]);
    if (!params) return 'rgb(120, 130, 140)';

    const { l, a: aStr, b: bStr, alpha: alphaStr } = params;

    let L = l.endsWith('%') ? parseFloat(l) / 100 : parseFloat(l);
    let a = parseFloat(aStr);
    let b = parseFloat(bStr);

    if (isNaN(L) || isNaN(a) || isNaN(b)) {
      return 'rgb(120, 130, 140)';
    }

    let alpha = 1;
    if (alphaStr) {
      alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
      if (isNaN(alpha)) alpha = 1;
    }

    // OKLAB to Linear sRGB
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const l_cube = l_ * l_ * l_;
    const m_cube = m_ * m_ * m_;
    const s_cube = s_ * s_ * s_;

    const r = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
    const g = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
    const b_res = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.707614701 * s_cube;

    // Linear sRGB to standard sRGB
    const f = (x: number) => {
      if (x <= 0.0031308) return 12.92 * x;
      return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    };

    const R = Math.max(0, Math.min(255, Math.round(f(r) * 255)));
    const G = Math.max(0, Math.min(255, Math.round(f(g) * 255)));
    const B = Math.max(0, Math.min(255, Math.round(f(b_res) * 255)));

    if (alpha === 1) {
      return `rgb(${R}, ${G}, ${B})`;
    } else {
      return `rgba(${R}, ${G}, ${B}, ${alpha})`;
    }
  } catch (err) {
    return 'rgb(120, 130, 140)';
  }
}

// Transform helper to process any oklch or oklab colors to compliant standard rgb
function replaceModernColors(val: any): any {
  if (!val || typeof val !== 'string') return val;
  let res = val;
  if (res.includes('oklch')) {
    res = res.replace(/oklch\s*\([^)]+\)/gi, (m) => oklchToRgb(m));
  }
  if (res.includes('oklab')) {
    res = res.replace(/oklab\s*\([^)]+\)/gi, (m) => oklabToRgb(m));
  }
  return res;
}

// Convert computed OKLCH/OKLAB colors directly into high-compatibility inline RGB colors on the cloned nodes
function convertOklchToRgbRecursively(node: HTMLElement) {
  if (!node || !node.style) return;

  const computed = window.getComputedStyle(node);
  
  // Properties that might contain OKLCH definitions
  const colorProps = [
    'color',
    'background-color',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'stroke',
    'fill'
  ];

  for (const prop of colorProps) {
    let val = computed.getPropertyValue(prop);
    if (val && (val.includes('oklch') || val.includes('oklab'))) {
      const rgbVal = replaceModernColors(val);
      node.style.setProperty(prop, rgbVal);
    }
  }

  // Also convert box shadow if it contains oklch/oklab
  let shadow = computed.getPropertyValue('box-shadow');
  if (shadow && (shadow.includes('oklch') || shadow.includes('oklab'))) {
    const rgbShadow = replaceModernColors(shadow);
    node.style.setProperty('box-shadow', rgbShadow);
  }

  // Prevent SVG icons or SVG elements from collapsing
  if (node.tagName.toLowerCase() === 'svg') {
    const width = node.getAttribute('width') || computed.getPropertyValue('width');
    const height = node.getAttribute('height') || computed.getPropertyValue('height');
    if (width && width !== 'auto') node.style.width = width;
    if (height && height !== 'auto') node.style.height = height;
  }

  // Walk through children recursively
  const children = Array.from(node.children);
  for (const child of children) {
    convertOklchToRgbRecursively(child as HTMLElement);
  }
}

export async function downloadInvoiceAsPdf(invoice: Invoice, containerElementId: string): Promise<boolean> {
  // Setup global interception to transform any oklch color values to rgb values on-the-fly.
  // This is required because html2canvas's internal CSS parser crashes on modern CSS standard "oklch" color functions.
  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  const originalGetComputedStyle = window.getComputedStyle;
  
  const cssRuleDescriptor = Object.getOwnPropertyDescriptor(CSSRule.prototype, 'cssText');
  const styleDeclarationDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cssText');

  CSSStyleDeclaration.prototype.getPropertyValue = function (this: any, property: string): string {
    const realThis = this && this.__target__ ? this.__target__ : this;
    let val = originalGetPropertyValue.call(realThis, property);
    return replaceModernColors(val);
  };

  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === '__target__') {
          return target;
        }
        if (prop === 'getPropertyValue') {
          return (p: string) => {
            let val = target.getPropertyValue(p);
            return replaceModernColors(val);
          };
        }
        let val = Reflect.get(target, prop);
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return replaceModernColors(val);
      }
    });
  };

  if (cssRuleDescriptor && cssRuleDescriptor.get) {
    Object.defineProperty(CSSRule.prototype, 'cssText', {
      get(this: any) {
        const realThis = this && this.__target__ ? this.__target__ : this;
        let val = cssRuleDescriptor.get!.call(realThis);
        return replaceModernColors(val);
      },
      configurable: true
    });
  }

  if (styleDeclarationDescriptor && styleDeclarationDescriptor.get) {
    Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', {
      get(this: any) {
        const realThis = this && this.__target__ ? this.__target__ : this;
        let val = styleDeclarationDescriptor.get!.call(realThis);
        return replaceModernColors(val);
      },
      configurable: true
    });
  }

  let tempContainer: HTMLDivElement | null = null;

  try {
    // Find all elements matching the id (there could be multiples because of desktop/mobile views)
    const elements = document.querySelectorAll(`[id="${containerElementId}"]`);
    let element: HTMLElement | null = null;

    if (elements.length > 0) {
      // Prefer the first visible element (with height/width > 0)
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        if (el.offsetWidth > 0 || el.offsetHeight > 0) {
          element = el;
          break;
        }
      }
      // Fallback to the first found element if none are visibly active yet
      if (!element) {
        element = elements[0] as HTMLElement;
      }
    }

    if (!element) {
      console.error(`DOM Element #${containerElementId} not found`);
      return false;
    }

    const generatePdfFromCanvas = async (canvas: HTMLCanvasElement) => {
      if (!canvas || canvas.width === 0) {
        throw new Error("Invalid canvas width rendered");
      }
      const imgData = canvas.toDataURL('image/png');
      
      // Create portrait PDF (standard A4 size: 210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      // Professional standard layout margins with breathing room
      const marginHorizontal = 10;
      const topMargin = 15;        // rich, clean top margin
      const bottomMargin = 15;     // rich, clean bottom margin
      
      const imgWidth = pageWidth - (marginHorizontal * 2); // 190mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const printableHeight = pageHeight - topMargin - bottomMargin;
      let heightLeft = imgHeight;
      let pageIndex = 0;

      while (heightLeft > 0) {
        if (pageIndex > 0) {
          pdf.addPage();
        }
        
        // Calculate position for the current page slice
        const position = topMargin - (pageIndex * printableHeight);
        
        // Add the image slice
        pdf.addImage(imgData, 'PNG', marginHorizontal, position, imgWidth, imgHeight);
        
        // Mask top margin with solid white rectangle for clean top breathing space
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageWidth, topMargin, 'F');
        
        // Mask bottom margin with solid white rectangle for clean bottom safety margin
        pdf.rect(0, pageHeight - bottomMargin, pageWidth, bottomMargin, 'F');
        
        heightLeft -= printableHeight;
        pageIndex++;
      }

      const cleanedFileName = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
      pdf.save(`Invoice_${cleanedFileName}.pdf`);
    };

    // A. Create an off-screen viewport workspace at fixed off-screen coordinates but fully opaque (1.0) and visible!
    tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0px';
    tempContainer.style.zIndex = '9999';
    tempContainer.style.opacity = '1';
    tempContainer.style.width = '800px'; // Perfect portrait A4 ratio scale
    tempContainer.style.background = '#ffffff';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.pointerEvents = 'none';
    document.body.appendChild(tempContainer);

    // B. Clone the invoice container deeply
    const clone = element.cloneNode(true) as HTMLElement;
    
    // C. Remove outer layout margins and shadows for perfect page presentation
    clone.style.transform = 'none';
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
    clone.style.height = 'auto';
    clone.style.margin = '0px';
    clone.style.padding = '40px'; // Solid professional margin space
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.display = 'block';

    tempContainer.appendChild(clone);

    // D. Convert styling fully to inline styles on the clone using computed values
    convertOklchToRgbRecursively(clone);

    // E. Ensure all imagery inside the cloned tree are loaded before we rasterize
    const images = Array.from(tempContainer.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Resolve anyway on error to prevent blocking execution
        });
      })
    );

    // F. Render canvas with high resolution scale
    const canvas = await html2canvas(tempContainer, {
      scale: 2.0, // High-resolution scale for crystal clear typography rasterization
      useCORS: true,
      allowTaint: false, // Critical: prevent SecurityError when calling toDataURL()
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800, // Evaluates styles at desktop breakpoint
      windowHeight: tempContainer.offsetHeight // Locks natural layout height precisely
    });

    await generatePdfFromCanvas(canvas);
    return true;
  } catch (error) {
    console.warn("PDF generation off-screen flow failed, attempting local viewport capture fallback...", error);
    try {
      const elements = document.querySelectorAll(`[id="${containerElementId}"]`);
      let element: HTMLElement | null = null;
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          if (el.offsetWidth > 0 || el.offsetHeight > 0) {
            element = el;
            break;
          }
        }
        if (!element) element = elements[0] as HTMLElement;
      }
      
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2.0,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const generatePdfFromCanvasFallback = async (canvasFallback: HTMLCanvasElement) => {
          const imgData = canvasFallback.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
          });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          const marginHorizontal = 10;
          const topMargin = 15;
          const bottomMargin = 15;
          
          const imgWidth = pageWidth - (marginHorizontal * 2);
          const imgHeight = (canvasFallback.height * imgWidth) / canvasFallback.width;
          
          const printableHeight = pageHeight - topMargin - bottomMargin;
          let heightLeft = imgHeight;
          let pageIndex = 0;

          while (heightLeft > 0) {
            if (pageIndex > 0) {
              pdf.addPage();
            }
            const position = topMargin - (pageIndex * printableHeight);
            pdf.addImage(imgData, 'PNG', marginHorizontal, position, imgWidth, imgHeight);
            
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, topMargin, 'F');
            pdf.rect(0, pageHeight - bottomMargin, pageWidth, bottomMargin, 'F');
            
            heightLeft -= printableHeight;
            pageIndex++;
          }
          const cleanedFileName = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
          pdf.save(`Invoice_${cleanedFileName}.pdf`);
        };

        await generatePdfFromCanvasFallback(canvas);
        return true;
      }
      return false;
    } catch (fallbackError) {
      console.error("PDF generation fallback also failed:", fallbackError);
      return false;
    }
  } finally {
    // Restore original color/style parsers
    CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
    window.getComputedStyle = originalGetComputedStyle;
    if (cssRuleDescriptor) {
      Object.defineProperty(CSSRule.prototype, 'cssText', cssRuleDescriptor);
    }
    if (styleDeclarationDescriptor) {
      Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', styleDeclarationDescriptor);
    }

    // Remove the off-screen workspace
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}

export async function getInvoicePdfFile(invoice: Invoice, containerElementId: string): Promise<File | null> {
  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  const originalGetComputedStyle = window.getComputedStyle;
  
  const cssRuleDescriptor = Object.getOwnPropertyDescriptor(CSSRule.prototype, 'cssText');
  const styleDeclarationDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cssText');

  CSSStyleDeclaration.prototype.getPropertyValue = function (this: any, property: string): string {
    const realThis = this && this.__target__ ? this.__target__ : this;
    let val = originalGetPropertyValue.call(realThis, property);
    return replaceModernColors(val);
  };

  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === '__target__') {
          return target;
        }
        if (prop === 'getPropertyValue') {
          return (p: string) => {
            let val = target.getPropertyValue(p);
            return replaceModernColors(val);
          };
        }
        let val = Reflect.get(target, prop);
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return replaceModernColors(val);
      }
    });
  };

  if (cssRuleDescriptor && cssRuleDescriptor.get) {
    Object.defineProperty(CSSRule.prototype, 'cssText', {
      get(this: any) {
        const realThis = this && this.__target__ ? this.__target__ : this;
        let val = cssRuleDescriptor.get!.call(realThis);
        return replaceModernColors(val);
      },
      configurable: true
    });
  }

  if (styleDeclarationDescriptor && styleDeclarationDescriptor.get) {
    Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', {
      get(this: any) {
        const realThis = this && this.__target__ ? this.__target__ : this;
        let val = styleDeclarationDescriptor.get!.call(realThis);
        return replaceModernColors(val);
      },
      configurable: true
    });
  }

  let tempContainer: HTMLDivElement | null = null;

  try {
    const elements = document.querySelectorAll(`[id="${containerElementId}"]`);
    let element: HTMLElement | null = null;

    if (elements.length > 0) {
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        if (el.offsetWidth > 0 || el.offsetHeight > 0) {
          element = el;
          break;
        }
      }
      if (!element) {
        element = elements[0] as HTMLElement;
      }
    }

    if (!element) {
      console.error(`DOM Element #${containerElementId} not found`);
      return null;
    }

    tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0px';
    tempContainer.style.zIndex = '9999';
    tempContainer.style.opacity = '1';
    tempContainer.style.width = '800px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.pointerEvents = 'none';
    document.body.appendChild(tempContainer);

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
    clone.style.height = 'auto';
    clone.style.margin = '0px';
    clone.style.padding = '40px';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.display = 'block';

    tempContainer.appendChild(clone);
    convertOklchToRgbRecursively(clone);

    const images = Array.from(tempContainer.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );

    const canvas = await html2canvas(tempContainer, {
      scale: 2.0,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800,
      windowHeight: tempContainer.offsetHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const marginHorizontal = 10;
    const topMargin = 15;
    const bottomMargin = 15;
    
    const imgWidth = pageWidth - (marginHorizontal * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const printableHeight = pageHeight - topMargin - bottomMargin;
    let heightLeft = imgHeight;
    let pageIndex = 0;

    while (heightLeft > 0) {
      if (pageIndex > 0) {
        pdf.addPage();
      }
      const position = topMargin - (pageIndex * printableHeight);
      pdf.addImage(imgData, 'PNG', marginHorizontal, position, imgWidth, imgHeight);
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, topMargin, 'F');
      pdf.rect(0, pageHeight - bottomMargin, pageWidth, bottomMargin, 'F');
      
      heightLeft -= printableHeight;
      pageIndex++;
    }

    const blob = pdf.output('blob');
    const cleanedFileName = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
    return new File([blob], `Invoice_${cleanedFileName}.pdf`, { type: 'application/pdf' });

  } catch (error) {
    console.warn("Off-screen File generator path failed, trying fallback...", error);
    try {
      const elements = document.querySelectorAll(`[id="${containerElementId}"]`);
      let element: HTMLElement | null = null;
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          if (el.offsetWidth > 0 || el.offsetHeight > 0) {
            element = el;
            break;
          }
        }
        if (!element) element = elements[0] as HTMLElement;
      }
      
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2.0,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const marginHorizontal = 10;
        const topMargin = 15;
        const bottomMargin = 15;
        
        const imgWidth = pageWidth - (marginHorizontal * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const printableHeight = pageHeight - topMargin - bottomMargin;
        let heightLeft = imgHeight;
        let pageIndex = 0;

        while (heightLeft > 0) {
          if (pageIndex > 0) {
            pdf.addPage();
          }
          const position = topMargin - (pageIndex * printableHeight);
          pdf.addImage(imgData, 'PNG', marginHorizontal, position, imgWidth, imgHeight);
          
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageWidth, topMargin, 'F');
          pdf.rect(0, pageHeight - bottomMargin, pageWidth, bottomMargin, 'F');
          
          heightLeft -= printableHeight;
          pageIndex++;
        }

        const blob = pdf.output('blob');
        const cleanedFileName = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
        return new File([blob], `Invoice_${cleanedFileName}.pdf`, { type: 'application/pdf' });
      }
      return null;
    } catch (fallbackError) {
      console.error("PDF generation file fallback also failed:", fallbackError);
      return null;
    }
  } finally {
    CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
    window.getComputedStyle = originalGetComputedStyle;
    if (cssRuleDescriptor) {
      Object.defineProperty(CSSRule.prototype, 'cssText', cssRuleDescriptor);
    }
    if (styleDeclarationDescriptor) {
      Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', styleDeclarationDescriptor);
    }

    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}
