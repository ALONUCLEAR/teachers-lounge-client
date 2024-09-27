import { Injectable } from "@angular/core";
import { cloneDeep } from "lodash";
import { BehaviorSubject } from "rxjs";

type ToastClass = 't-success' | 't-error' | 't-info' | 't-warning';

export interface Toast {
    id: number;
    message: string;
    header: string;
    classes: ToastClass[];
    delay?: number;
}

type InputToast = Partial<Toast> & Pick<Toast, "header" | "message">;

const defaultToast = {
    classes: [],
};

@Injectable()
export class ToastService {
    private toasts: Toast[] = [];
    private toastsObservable = new BehaviorSubject<Toast[]>([]);

    private getNextId(): number {
        return Math.max(...this.toasts.map(({ id }) => id), -1) + 1;
    }

    private updateToasts(newToasts: Toast[]) {
        const clonedToasts = cloneDeep(newToasts);
        this.toasts = clonedToasts;
        this.toastsObservable.next(clonedToasts);
    }

    public getAllToasts(): Toast[] {
        return this.toasts;
    }

    public selectAllToasts$(): BehaviorSubject<Toast[]> {
        return this.toastsObservable;
    }

    public show(toast: InputToast): void {
        const fullToast = {...defaultToast, id: this.getNextId(), ...toast};
        this.updateToasts([...this.toasts, fullToast]);
    }

    public remove(toast: Toast): void {
        this.updateToasts(this.toasts.filter(t => t !== toast));
    }
}