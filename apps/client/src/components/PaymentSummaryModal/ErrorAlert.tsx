interface ErrorAlertProps {
    message: string;
}

export const ErrorAlert = ({ message }: ErrorAlertProps) => {
    return (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {message}
            </p>
        </div>
    );
};
