import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class authGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate():  Observable<boolean> {
    return this.authService.estaAutenticado$.pipe(
      tap( estaAutenticado => {
        if(!estaAutenticado){
          console.log("Error acceso denegado")
          this.router.navigate(['/auth']);
        }else{
          console.log("Acceso permitido")

        }
      }
      ), 

    map(estaAutenticado => estaAutenticado)
    );
  }
};
