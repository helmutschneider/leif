import * as React from 'react';

type Props = React.PropsWithChildren<{
    actions?: React.ReactNode
    close: () => unknown
    show: boolean
    title: React.ReactNode
}>

export const Modal: React.FC<Props> = props => {
    const clazz = props.show ? 'modal show' : 'modal';
    const style: React.CSSProperties = {
        display: props.show ? 'block' : 'none',
    };

    React.useEffect(() => {
        const backdropElement = document.body.querySelector('.modal-backdrop');
        if (props.show && !backdropElement) {
            const node = document.createElement('div');
            node.className = 'modal-backdrop show';
            document.body.appendChild(node);
        }
        if (!props.show && backdropElement) {
            document.body.removeChild(backdropElement);
        }
    }, [props.show]);

    function close(event: React.MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        props.close?.();
    };

    return (
        <div className={clazz} tabIndex={-1} style={style}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5">{props.title}</h1>
                        <button type="button" className="btn-close" onClick={close}></button>
                    </div>
                    <div className="modal-body">
                        {props.children}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={close}>Close</button>
                        {props.actions}
                    </div>
                </div>
            </div>
        </div>
    )
};
