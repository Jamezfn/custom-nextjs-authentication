import { SignInForm } from "@/auth/nextjs/components//signInForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

type Prop = {
    searchParams: Promise<{ oauthError?: string }>
}

export default async function SignIn({ searchParams }: Prop) {
    const { oauthError } = await searchParams;

    return (
        <div className="container mx-auto p-4 max-w-187.5">
            <Card>
                <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    {oauthError && (
                        <CardDescription className="text-destructive">
                            {oauthError}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <SignInForm />
                </CardContent>
            </Card>
        </div>
    )
}