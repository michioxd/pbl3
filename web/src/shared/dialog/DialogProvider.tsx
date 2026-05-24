import { Button, Dialog, Flex, Select, Switch, Text, TextField } from "@radix-ui/themes";
import { useState, useCallback, useMemo } from "react";
import {
    DialogContext,
    DialogType,
    type DialogContent,
    type DialogCustomButtons,
    type DialogData,
    type DialogField,
} from "./Dialog";
import { useTranslation } from "react-i18next";

export default function DialogProvider({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<DialogData>({ type: DialogType.Alert, title: "", content: "" });
    const [fieldData, setFieldData] = useState<string[]>([]);

    const closeDialog = useCallback(() => setOpen(false), []);

    const resolveContent = useCallback(
        (content: DialogContent) => (typeof content === "function" ? content(closeDialog) : content),
        [closeDialog],
    );

    const dialog = useMemo(
        () => ({
            alert: ({
                title,
                content,
                onConfirm,
                buttons,
            }: {
                title: React.ReactNode;
                content: DialogContent;
                onConfirm?: VoidFunction;
                buttons?: DialogCustomButtons;
            }) => {
                setData({ type: DialogType.Alert, title, content: resolveContent(content), onConfirm, buttons });
                setOpen(true);
            },
            confirm: ({
                title,
                content,
                onConfirm,
                onCancel,
                buttons,
            }: {
                title: React.ReactNode;
                content: DialogContent;
                onConfirm?: VoidFunction;
                onCancel?: VoidFunction;
                buttons?: DialogCustomButtons;
            }) => {
                setData({
                    type: DialogType.Confirm,
                    title,
                    content: resolveContent(content),
                    onConfirm,
                    onCancel,
                    buttons,
                });
                setOpen(true);
            },
            prompt: ({
                title,
                content,
                inputs,
                onConfirm,
                onCancel,
                buttons,
            }: {
                title: React.ReactNode;
                content: DialogContent;
                inputs: DialogField[];
                onConfirm?: (value: string[], close: VoidFunction) => void;
                onCancel?: VoidFunction;
                buttons?: DialogCustomButtons;
            }) => {
                setData({
                    type: DialogType.Prompt,
                    title,
                    content: resolveContent(content),
                    inputs,
                    onConfirm,
                    onCancel,
                    buttons,
                });
                setFieldData(inputs.map((i) => i.defaultValue || ""));
                setOpen(true);
            },
            show: (newData: DialogData) => {
                setData(newData);
                setOpen(true);
            },
            close: closeDialog,
        }),
        [closeDialog, resolveContent],
    );

    const handleFieldChange = (index: number, value: string) => {
        setFieldData((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleConfirm = () => {
        if (data.type === DialogType.Prompt) {
            data.onConfirm?.(fieldData, closeDialog);
        } else {
            closeDialog();
            data.onConfirm?.();
        }
    };

    const handleCancel = () => {
        closeDialog();
        if ("onCancel" in data) data.onCancel?.();
    };

    const isPromptInvalid =
        data.type === DialogType.Prompt &&
        data.inputs.some(
            (input, index) => input.type === "input" && input.validate && !input.validate(fieldData[index]),
        );

    return (
        <DialogContext.Provider value={{ dialog }}>
            <Dialog.Root open={open}>
                <Dialog.Content aria-describedby="dialog-desc">
                    <Dialog.Title>{data.title}</Dialog.Title>
                    {data.content && (
                        <Text as="div" size="2" id="dialog-description">
                            {typeof data.content === "function" ? data.content(() => setOpen(false)) : data.content}
                        </Text>
                    )}

                    {data.type === DialogType.Prompt && (
                        <Flex direction="column" gap="3" mt="4">
                            {data.inputs.map((input, index) => (
                                <label key={index} className={input.type === "select" ? "w-full" : ""}>
                                    {input.label && (
                                        <Text as="div" size="2" mb="1" weight="bold">
                                            {input.label}
                                        </Text>
                                    )}
                                    {input.type === "input" ? (
                                        <TextField.Root
                                            placeholder={input.placeholder}
                                            value={fieldData[index]}
                                            onChange={(e) => handleFieldChange(index, e.target.value)}
                                            {...input.inputProps}
                                        />
                                    ) : input.type === "select" ? (
                                        <Select.Root
                                            defaultValue={input.defaultValue}
                                            value={fieldData[index]}
                                            onValueChange={(value) => handleFieldChange(index, value)}
                                            {...input.selectProps}
                                        >
                                            <Select.Trigger className="w-full!" placeholder={input.placeholder} />
                                            <Select.Content className="w-full" variant="soft">
                                                {input.options.map((opt) => (
                                                    <Select.Item key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Root>
                                    ) : (
                                        <Switch
                                            checked={fieldData[index] === "1" ? true : false}
                                            onCheckedChange={(checked) => handleFieldChange(index, checked ? "1" : "0")}
                                            {...input.switchProps}
                                        />
                                    )}
                                </label>
                            ))}
                        </Flex>
                    )}

                    {data.buttons === null ? null : data.buttons ? (
                        <Flex gap="3" mt="4" justify="end" align="center">
                            {data.buttons(handleConfirm, handleCancel)}
                        </Flex>
                    ) : (
                        <Flex gap="3" mt="4" justify="end" align="center">
                            {data.type !== DialogType.Alert && (
                                <Button variant="soft" color="gray" onClick={handleCancel}>
                                    {t("common:cancel")}
                                </Button>
                            )}
                            <Button
                                onClick={handleConfirm}
                                disabled={isPromptInvalid}
                                variant={data.type === DialogType.Alert ? "soft" : "solid"}
                                color={data.type === DialogType.Alert ? "gray" : undefined}
                            >
                                {data.type === DialogType.Alert ? t("common:ok") : t("common:confirm")}
                            </Button>
                        </Flex>
                    )}
                </Dialog.Content>
            </Dialog.Root>
            {children}
        </DialogContext.Provider>
    );
}
