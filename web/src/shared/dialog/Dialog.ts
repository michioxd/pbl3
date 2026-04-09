import type { Select, SwitchProps, TextField } from "@radix-ui/themes";
import { createContext, useContext } from "react";

export interface DialogContextType {
    dialog: {
        alert: (args: {
            title: React.ReactNode;
            content: DialogContent;
            onConfirm?: VoidFunction;
            buttons?: DialogCustomButtons;
        }) => void;
        confirm: (args: {
            title: React.ReactNode;
            content: DialogContent;
            onConfirm?: VoidFunction;
            onCancel?: VoidFunction;
            buttons?: DialogCustomButtons;
        }) => void;
        prompt: (args: {
            title: React.ReactNode;
            content: DialogContent;
            inputs: DialogField[];
            onConfirm?: (value: string[], close: VoidFunction) => void;
            onCancel?: VoidFunction;
            buttons?: DialogCustomButtons;
        }) => void;
        show: (data: DialogData) => void;
        close: VoidFunction;
    };
}

export type DialogField =
    | {
          type: "input";
          label?: React.ReactNode;
          placeholder?: string;
          defaultValue?: string;
          inputProps?: TextField.RootProps;
          validate?: (value: string) => boolean;
      }
    | {
          type: "select";
          label?: React.ReactNode;
          placeholder?: string;
          defaultValue?: string;
          options: { label: React.ReactNode; value: string }[];
          selectProps?: Select.RootProps;
      }
    | {
          type: "switch";
          label?: React.ReactNode;
          defaultValue?: "0" | "1";
          switchProps?: SwitchProps;
      };

export type DialogContent = React.ReactNode | ((close: VoidFunction) => React.ReactNode);
export type DialogCustomButtons = ((onConfirm: VoidFunction, onCancel: VoidFunction) => React.ReactNode) | null;
export type VoidFunction = () => void;

export type DialogData =
    | {
          type: DialogType.Alert;
          title: React.ReactNode;
          content?: React.ReactNode | ((close: () => void) => React.ReactNode);
          buttons?: DialogCustomButtons;
          onConfirm?: VoidFunction;
      }
    | {
          type: DialogType.Confirm;
          title: React.ReactNode;
          content?: React.ReactNode | ((close: () => void) => React.ReactNode);
          buttons?: DialogCustomButtons;
          onConfirm?: VoidFunction;
          onCancel?: VoidFunction;
      }
    | {
          type: DialogType.Prompt;
          title: React.ReactNode;
          content?: React.ReactNode | ((close: () => void) => React.ReactNode);
          inputs: DialogField[];
          buttons?: DialogCustomButtons;
          onConfirm?: (value: string[], close: VoidFunction) => void;
          onCancel?: VoidFunction;
      };

export enum DialogType {
    Alert = "alert",
    Confirm = "confirm",
    Prompt = "prompt",
}

export const DialogContext = createContext<DialogContextType | null>(null);

export default function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error("useDialog must be used within a DialogProvider");
    }
    return context.dialog;
}

export const confirm = async (title: string, content: string, dialog: DialogContextType["dialog"]) => {
    return new Promise<boolean>((resolve) => {
        dialog.confirm({
            title: title,
            content,
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
        });
    });
};
