# React Hook Form + Zod Patterns Reference

## Basic Setup

```typescript
// schemas/loginSchema.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "At least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

```tsx
// components/LoginForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/schemas/loginSchema";

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await login(data);
      })}
    >
      <input type="email" {...register("email")} />
      {errors.email && <p>{errors.email.message}</p>}

      <input type="password" {...register("password")} />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        Login
      </button>
    </form>
  );
}
```

## Complex Zod Schema with Cross-field Validation

```typescript
import { z } from "zod";

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(20, "At most 20 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
    email: z.string().email("Invalid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must include uppercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string(),
    age: z
      .number({ invalid_type_error: "Must be a number" })
      .min(18, "Must be 18+"),
    plan: z.enum(["free", "pro", "enterprise"], {
      errorMap: () => ({ message: "Please select a plan" }),
    }),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
```

## Number and Date Inputs

```tsx
// For number inputs, use valueAsNumber
<input
  type="number"
  {...register('age', { valueAsNumber: true })}
/>

// For date inputs, use valueAsDate
<input
  type="date"
  {...register('birthday', { valueAsDate: true })}
/>
```

## Zod Schema for Number Input

```typescript
const schema = z.object({
  // Handles NaN from empty input
  price: z
    .number({ invalid_type_error: "Must be a number" })
    .positive("Must be positive")
    .optional()
    .or(z.nan().transform(() => undefined)),
});
```

## Controlled Components with useController

For UI libraries (shadcn/ui, Radix, custom components) that can't use `register`:

```tsx
import { useController, Control } from "react-hook-form";

interface ControlledSelectProps {
  name: string;
  control: Control<any>;
  options: { value: string; label: string }[];
}

function ControlledSelect({ name, control, options }: ControlledSelectProps) {
  const {
    field: { value, onChange, onBlur, ref },
    fieldState: { error },
  } = useController({ name, control });

  return (
    <div>
      <Select value={value} onValueChange={onChange} onOpenChange={onBlur}>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </Select>
      {error && <p>{error.message}</p>}
    </div>
  );
}
```

## Dynamic Field Arrays

```tsx
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Required"),
        quantity: z.number().min(1),
      }),
    )
    .min(1, "At least one item required"),
});

type FormValues = z.infer<typeof schema>;

function DynamicForm() {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ name: "", quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`items.${index}.name`)} placeholder="Name" />
          {errors.items?.[index]?.name && (
            <p>{errors.items[index].name.message}</p>
          )}
          <input
            type="number"
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: "", quantity: 1 })}>
        Add Item
      </button>
      <button type="submit">Submit</button>
    </form>
  );
}
```

## useFormState for Isolated Re-renders

Prevent the entire form from re-rendering when only one part changes:

```tsx
import { useForm, useFormState } from "react-hook-form";

function ErrorSummary({ control }: { control: Control<FormValues> }) {
  const { errors } = useFormState({ control });
  const errorList = Object.entries(errors);

  if (!errorList.length) return null;
  return (
    <ul>
      {errorList.map(([field, error]) => (
        <li key={field}>{error?.message as string}</li>
      ))}
    </ul>
  );
}

function SubmitButton({ control }: { control: Control<FormValues> }) {
  const { isSubmitting, isValid, isDirty } = useFormState({ control });
  return (
    <button type="submit" disabled={isSubmitting || !isValid || !isDirty}>
      {isSubmitting ? "Saving..." : "Save"}
    </button>
  );
}
```

## Async Validation

```typescript
const schema = z.object({
  username: z
    .string()
    .min(3)
    .refine(async (username) => {
      const res = await fetch(`/api/check-username?u=${username}`);
      const { available } = await res.json();
      return available;
    }, "Username already taken"),
});

// Use mode: 'onBlur' for async validation to avoid too many API calls
useForm({ resolver: zodResolver(schema), mode: "onBlur" });
```

## TypeScript: Forcing input vs output types

```typescript
// When input type differs from output type (e.g., optional → required after transform)
const schema = z.object({
  count: z.string().transform(Number), // input: string, output: number
});

useForm<z.input<typeof schema>, any, z.output<typeof schema>>({
  resolver: zodResolver(schema),
});
```

## Integration with Zustand

Pattern for persisting form data to a global store after submission:

```tsx
function ProductForm() {
  const addProduct = useProductStore((s) => s.addProduct);

  const { register, handleSubmit, reset } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductFormValues) => {
    const product = await api.createProduct(data);
    addProduct(product); // update global Zustand store
    reset();
  };

  return <form onSubmit={handleSubmit(onSubmit)}>{/* fields */}</form>;
}
```
