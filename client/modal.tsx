import * as React from 'react';
import { KeyCode } from "./types";

type ModalSize = 'sm' | 'default' | 'lg' | 'xl'
type Props = React.PropsWithChildren<{
  actions?: React.ReactNode
  close: () => unknown
  show: boolean
  size?: ModalSize
  title: React.ReactNode
}>

const sizeClazzes: { [K in ModalSize]: string } = {
  sm: 'modal-sm',
  default: '',
  lg: 'modal-lg',
  xl: 'modal-xl',
};

export const Modal: React.FC<Props> = props => {
  const clazz = props.show ? 'modal show' : 'modal';
  const style: React.CSSProperties = {
    display: props.show ? 'block' : 'none',
  };

  React.useEffect(() => {
    const backdropElement = document.body.querySelector('.modal-backdrop');
    if (props.show) {
      if (!backdropElement) {
        const node = document.createElement('div');
        node.className = 'modal-backdrop show';
        document.body.appendChild(node);
      }
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      if (backdropElement) {
        document.body.removeChild(backdropElement)
      }
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, [props.show]);

  React.useEffect(() => {
    // close the modal when escape is pressed.
    function listener(event: KeyboardEvent) {
      if (props.show && event.keyCode === KeyCode.Escape) {
        props.close();
      }
    }
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, [props.show]);

  function close(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    props.close();
  }

  const sizeClazz = sizeClazzes[props.size || 'default'];

  return (
    <div className={clazz} tabIndex={-1} style={style}>
      <div className={'modal-dialog ' + sizeClazz}>
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5">{props.title}</h1>
            <button type="button" className="btn-close" onClick={close}></button>
          </div>
          <div className="modal-body">
            {props.children}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={close}>Avbryt</button>
            {props.actions}
          </div>
        </div>
      </div>
    </div>
  )
};
