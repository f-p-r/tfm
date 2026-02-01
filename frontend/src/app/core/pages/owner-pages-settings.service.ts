import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { PageOwnerType } from '../../shared/content/page.dto';

@Injectable({
  providedIn: 'root',
})
export class OwnerPagesSettingsService {
  /**
   * Mock storage for home page IDs
   * Key format: "{serializedOwnerType}:{ownerId}"
   * Value: pageId or null
   */
  private mockStorage = new Map<string, number | null>([
    ['2:1', 1], // Association 1 has page 1 as home
  ]);

  /**
   * Serialize PageOwnerType to string for storage key
   */
  private serializeOwnerType(type: PageOwnerType): string {
    return type.toString();
  }

  /**
   * Generate storage key for owner
   */
  private getKey(ownerType: PageOwnerType, ownerId: number): string {
    const serialized = this.serializeOwnerType(ownerType);
    return `${serialized}:${ownerId}`;
  }

  /**
   * Get the home page ID for a given owner
   * Returns null if no home page is set
   */
  getHomePageId(
    ownerType: PageOwnerType,
    ownerId: number,
  ): Observable<number | null> {
    const key = this.getKey(ownerType, ownerId);
    const homePageId = this.mockStorage.get(key) ?? null;
    return of(homePageId).pipe(delay(100));
  }

  /**
   * Set the home page ID for a given owner
   * Pass null to unset the home page
   */
  setHomePageId(
    ownerType: PageOwnerType,
    ownerId: number,
    pageId: number | null,
  ): Observable<void> {
    const key = this.getKey(ownerType, ownerId);
    this.mockStorage.set(key, pageId);
    return of(undefined).pipe(delay(100));
  }
}
