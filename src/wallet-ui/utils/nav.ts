// confirm tab close if important modal open
const unloadCallback: any = (event: any) => {
  event.preventDefault();
  event.returnValue = '';
  return '';
};


export const unwatchTabClose = () => window.removeEventListener('beforeunload', unloadCallback)

export const watchTabClose = () => window.addEventListener('beforeunload', unloadCallback)