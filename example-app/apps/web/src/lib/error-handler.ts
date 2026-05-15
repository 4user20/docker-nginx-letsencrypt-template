import { toast } from "sonner";

/**
 * Parse API errors and show user-friendly toast messages.
 * Call this in catch blocks of API calls.
 */
export function handleApiError(error: unknown, locale: "ru" | "en" = "ru") {
  const message = error instanceof Error ? error.message : String(error);

  // Try to extract status from response text
  let status: number | null = null;
  let body: any = null;

  // Check if it looks like an HTTP error
  if (message.includes("Request failed:")) {
    // Default to 500 for generic failures
    status = 500;
  }

  // Try to parse JSON body if present
  try {
    body = JSON.parse(message);
    if (body.statusCode) status = body.statusCode;
  } catch {
    // Not JSON — use text
  }

  // Check for common status codes in the message
  if (message.includes("401") || message.includes("Unauthorized")) status = 401;
  else if (message.includes("403") || message.includes("Forbidden")) status = 403;
  else if (message.includes("404") || message.includes("Not found")) status = 404;
  else if (message.includes("409") || message.includes("Conflict")) status = 409;
  else if (message.includes("422") || message.includes("Validation")) status = 422;
  else if (message.includes("500") || message.includes("Server error")) status = 500;

  // Network errors (fetch failed)
  if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("Network request failed")) {
    toast.error(
      locale === "ru" ? "Ошибка соединения" : "Connection failed",
      {
        description:
          locale === "ru"
            ? "Проверьте подключение к интернету."
            : "Please check your internet connection.",
      },
    );
    return;
  }

  // Determine user-friendly message based on status
  switch (status) {
    case 401:
      toast.error(
        locale === "ru" ? "Сессия истекла" : "Session expired",
        {
          description:
            locale === "ru"
              ? "Пожалуйста, войдите снова."
              : "Please sign in again.",
        },
      );
      break;
    case 403:
      toast.error(
        locale === "ru" ? "Доступ запрещён" : "Access denied",
        {
          description:
            locale === "ru"
              ? "У вас нет прав для этого действия."
              : "You don't have permission to perform this action.",
        },
      );
      break;
    case 404:
      toast.error(
        locale === "ru" ? "Не найдено" : "Not found",
        {
          description:
            locale === "ru"
              ? "Запрошенный ресурс не найден."
              : "The requested resource was not found.",
        },
      );
      break;
    case 409:
      toast.error(
        locale === "ru" ? "Конфликт" : "Conflict",
        {
          description:
            locale === "ru"
              ? "Этот email уже зарегистрирован."
              : "This email is already registered.",
        },
      );
      break;
    case 422:
      // Check for Zod validation errors in the response
      if (body?.errors || body?.issues) {
        const issues = body.errors || body.issues || [];
        const details = Array.isArray(issues)
          ? issues.map((i: any) => `${i.path?.join(".") ?? ""}: ${i.message}`).join("; ")
          : locale === "ru"
            ? "Проверьте введённые данные."
            : "Please check your input.";
        toast.error(
          locale === "ru" ? "Ошибка валидации" : "Validation error",
          { description: details },
        );
      } else {
        toast.error(
          locale === "ru" ? "Ошибка валидации" : "Validation error",
          {
            description:
              locale === "ru"
                ? "Проверьте введённые данные."
                : "Please check your input.",
          },
        );
      }
      break;
    default:
      toast.error(
        locale === "ru" ? "Что-то пошло не так" : "Something went wrong",
        {
          description:
            locale === "ru"
              ? "Пожалуйста, попробуйте снова."
              : "Please try again.",
        },
      );
  }
}
